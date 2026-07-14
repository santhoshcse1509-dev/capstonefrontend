package com.insurance.service;

import com.insurance.dto.claim.ClaimHistoryResponse;
import com.insurance.dto.claim.ClaimRequest;
import com.insurance.dto.claim.ClaimResponse;
import com.insurance.dto.claim.ClaimStatusUpdateRequest;
import com.insurance.entity.*;
import com.insurance.exception.BadRequestException;
import com.insurance.exception.ResourceNotFoundException;
import com.insurance.repository.*;
import com.insurance.util.ClaimNumberGenerator;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class ClaimService {

    private final ClaimRepository claimRepository;
    private final CustomerPolicyRepository customerPolicyRepository;
    private final UserRepository userRepository;
    private final ClaimHistoryRepository claimHistoryRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final TriageConfigRepository triageConfigRepository;
    private final ClaimRiskFlagRepository claimRiskFlagRepository;
    private final AuditLogRepository auditLogRepository;
    private final BankDetailsRepository bankDetailsRepository;

    public ClaimService(ClaimRepository claimRepository, CustomerPolicyRepository customerPolicyRepository,
                        UserRepository userRepository, ClaimHistoryRepository claimHistoryRepository,
                        SimpMessagingTemplate messagingTemplate, TriageConfigRepository triageConfigRepository,
                        ClaimRiskFlagRepository claimRiskFlagRepository, AuditLogRepository auditLogRepository,
                        BankDetailsRepository bankDetailsRepository) {
        this.claimRepository = claimRepository;
        this.customerPolicyRepository = customerPolicyRepository;
        this.userRepository = userRepository;
        this.claimHistoryRepository = claimHistoryRepository;
        this.messagingTemplate = messagingTemplate;
        this.triageConfigRepository = triageConfigRepository;
        this.claimRiskFlagRepository = claimRiskFlagRepository;
        this.auditLogRepository = auditLogRepository;
        this.bankDetailsRepository = bankDetailsRepository;
    }

    @Transactional
    public ClaimResponse submitClaim(UUID userId, ClaimRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        CustomerPolicy customerPolicy = customerPolicyRepository.findById(request.getCustomerPolicyId())
                .orElseThrow(() -> new ResourceNotFoundException("Policy not found"));

        if (!customerPolicy.getUser().getId().equals(userId)) {
            throw new BadRequestException("You do not own this policy.");
        }

        if (customerPolicy.getStatus() == PolicyStatus.SURRENDERED) {
            throw new BadRequestException("Cannot file a claim on a surrendered policy.");
        }
        if (customerPolicy.getStatus() == PolicyStatus.LAPSED) {
            throw new BadRequestException("Cannot file a claim on a lapsed policy.");
        }
        if (customerPolicy.getStatus() != PolicyStatus.ACTIVE && customerPolicy.getStatus() != PolicyStatus.GRACE_PERIOD) {
            throw new BadRequestException("Cannot file a claim on an inactive policy.");
        }

        // Duplicate-claim check
        List<Claim> existingClaims = claimRepository.findByCustomerPolicyId(customerPolicy.getId());
        boolean hasDuplicateTypeInProgress = existingClaims.stream()
                .anyMatch(c -> c.getClaimType().equalsIgnoreCase(request.getClaimType()) &&
                               c.getStatus() != ClaimStatus.REJECTED &&
                               c.getStatus() != ClaimStatus.PAID);
        if (hasDuplicateTypeInProgress) {
            throw new BadRequestException("A claim of this type is already in progress for this policy.");
        }

        // Document checklist validation
        List<String> docs = request.getUploadedClaimDocuments() != null ? request.getUploadedClaimDocuments() : new ArrayList<>();
        if ("DEATH".equalsIgnoreCase(request.getClaimType())) {
            if (!docs.contains("DEATH_CERTIFICATE") || !docs.contains("CLAIMANT_ID")) {
                throw new BadRequestException("Missing required documents for DEATH claim: DEATH_CERTIFICATE, CLAIMANT_ID.");
            }
        } else if ("MATURITY".equalsIgnoreCase(request.getClaimType())) {
            if (!docs.contains("POLICY_BOND") || !docs.contains("DISCHARGE_VOUCHER")) {
                throw new BadRequestException("Missing required documents for MATURITY claim: POLICY_BOND, DISCHARGE_VOUCHER.");
            }
        } else if ("CRITICAL_ILLNESS".equalsIgnoreCase(request.getClaimType())) {
            if (!docs.contains("DIAGNOSIS_REPORT") || !docs.contains("HOSPITAL_SUMMARY")) {
                throw new BadRequestException("Missing required documents for CRITICAL_ILLNESS claim: DIAGNOSIS_REPORT, HOSPITAL_SUMMARY.");
            }
        }

        // Legal Heir Fallback Flow
        if (request.isLegalHeirVerificationRequired()) {
            if (!docs.contains("LEGAL_HEIR_CERTIFICATE") && !docs.contains("SUCCESSION_CERTIFICATE")) {
                throw new BadRequestException("Missing required legal succession document: LEGAL_HEIR_CERTIFICATE or SUCCESSION_CERTIFICATE.");
            }
        }

        // 1. RULES-BASED FRAUD SCORING (Feature #6)
        int fraudScore = 10; // base score
        List<String> riskReasons = new ArrayList<>();
        List<String> detectedFlags = new ArrayList<>();

        // Check A: Duplicate claim check
        boolean hasDuplicateAmount = existingClaims.stream()
                .anyMatch(c -> c.getClaimAmount().compareTo(request.getClaimAmount()) == 0);
        if (hasDuplicateAmount) {
            fraudScore += 35;
            riskReasons.add("Duplicate claim amount detected for this policy.");
            detectedFlags.add("DUPLICATE_CLAIM_AMOUNT");
        }

        // Check B: Date mismatch
        if (LocalDate.now().isBefore(customerPolicy.getStartDate())) {
            fraudScore += 30;
            riskReasons.add("Claim date precedes policy start date.");
            detectedFlags.add("DATE_PRE_POLICY");
        }

        // Check C: High payout ratio (>80% of Sum Assured)
        if (customerPolicy.getSumAssured() != null && customerPolicy.getSumAssured().compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal ratio = request.getClaimAmount().divide(customerPolicy.getSumAssured(), 2, java.math.RoundingMode.HALF_UP);
            if (ratio.compareTo(new BigDecimal("0.80")) > 0) {
                fraudScore += 25;
                riskReasons.add("Claim amount exceeds 80% of policy sum assured.");
                detectedFlags.add("HIGH_PAYOUT_RATIO");
            }
        }

        // Check D: Repeat filings (>2 claims filed in last 30 days)
        LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(30);
        long pastMonthClaimsCount = claimRepository.findByUserId(userId).stream()
                .filter(c -> c.getSubmittedAt() != null && c.getSubmittedAt().isAfter(thirtyDaysAgo))
                .count();
        if (pastMonthClaimsCount > 2) {
            fraudScore += 20;
            riskReasons.add("Multiple claims filed by user in the past 30 days.");
            detectedFlags.add("REPEAT_FILINGS_ALERT");
        }

        fraudScore = Math.min(fraudScore, 100);
        String fraudReasonsStr = riskReasons.isEmpty()
                ? "Claim meets standard compliance rules."
                : String.join(" | ", riskReasons);

        // Build base claim object in SUBMITTED status first
        Claim claim = Claim.builder()
                .claimNumber(ClaimNumberGenerator.generate())
                .customerPolicy(customerPolicy)
                .user(user)
                .claimType(request.getClaimType())
                .description(request.getDescription())
                .claimAmount(request.getClaimAmount())
                .status(ClaimStatus.SUBMITTED)
                .fraudRiskScore((double) fraudScore / 100.0) // Maintain DB compat (0.0 - 1.0)
                .fraudReasons(fraudReasonsStr)
                .submittedAt(LocalDateTime.now())
                .triageResult("PENDING")
                .claimantRelation(request.getClaimantRelation())
                .claimantName(request.getClaimantName())
                .legalHeirVerificationRequired(request.isLegalHeirVerificationRequired())
                .uploadedClaimDocuments(request.getUploadedClaimDocuments() != null ? String.join(",", request.getUploadedClaimDocuments()) : null)
                .build();

        Claim savedClaim = claimRepository.save(claim);

        // Save risk flags
        for (String flagType : detectedFlags) {
            ClaimRiskFlag riskFlag = ClaimRiskFlag.builder()
                    .claim(savedClaim)
                    .flagType(flagType)
                    .detectedAt(LocalDateTime.now())
                    .build();
            claimRiskFlagRepository.save(riskFlag);
        }

        // 2. AUTOMATED CLAIMS TRIAGE - STP (Feature #2)
        String policyTypeName = customerPolicy.getPolicy().getPolicyType().getName();
        Optional<TriageConfig> triageConfigOpt = triageConfigRepository.findByProductCategoryNameIgnoreCase(policyTypeName);

        if (triageConfigOpt.isPresent()) {
            TriageConfig config = triageConfigOpt.get();
            if (config.isAutoTriageEnabled()) {
                boolean meetsTriage = true;
                String triageEscalationReason = "";

                if (request.getClaimAmount().compareTo(config.getMaxPayoutLimit()) > 0) {
                    meetsTriage = false;
                    triageEscalationReason = "Escalated: Claim amount exceeds auto-approval threshold.";
                }

                if (meetsTriage && config.isRequiresNoPriorClaims() && !existingClaims.isEmpty()) {
                    meetsTriage = false;
                    triageEscalationReason = "Escalated: Prior claims exist on this policy.";
                }

                if (meetsTriage && "LIFE".equalsIgnoreCase(policyTypeName)) {
                    meetsTriage = false;
                    triageEscalationReason = "Escalated: High-risk product category (LIFE).";
                }

                if (meetsTriage && fraudScore >= 40) {
                    meetsTriage = false;
                    triageEscalationReason = "Escalated: Fraud risk score is above acceptable threshold.";
                }

                if (meetsTriage && (user.getKycStatus() == KycStatus.EXPIRED || user.getKycStatus() != KycStatus.VERIFIED)) {
                    meetsTriage = false;
                    triageEscalationReason = "Escalated: Claimant KYC status is expired or unverified.";
                }

                if (meetsTriage) {
                    List<com.insurance.entity.BankDetails> verifiedAccounts = bankDetailsRepository.findByOwnerIdAndIsVerifiedTrue(user.getId());
                    if (verifiedAccounts.isEmpty()) {
                        meetsTriage = false;
                        triageEscalationReason = "Escalated: Claimant has no verified bank details for payout routing.";
                    }
                }

                if (meetsTriage) {
                    // Straight-through Auto Approval
                    savedClaim.setTriageResult("AUTO_APPROVED");
                    savedClaim.setTriageReason("Triage rules matched base auto-approval conditions.");
                    savedClaim.setStatus(ClaimStatus.APPROVED);
                    savedClaim.setApprovedAmount(request.getClaimAmount());
                    savedClaim.setResolvedAt(LocalDateTime.now());
                    claimRepository.save(savedClaim);

                    // Record Audit Log
                    AuditLog auditLog = AuditLog.builder()
                            .action("AUTO_APPROVE_CLAIM")
                            .entityType("Claim")
                            .entityId(savedClaim.getId().toString())
                            .details(String.format("Claim %s automatically approved by STP rules engine. Amount: ₹%s",
                                    savedClaim.getClaimNumber(), savedClaim.getClaimAmount()))
                            .timestamp(LocalDateTime.now())
                            .build();
                    auditLogRepository.save(auditLog);

                    saveClaimHistory(savedClaim, null, "Claim auto-approved by STP triage engine.");
                } else {
                    savedClaim.setTriageResult("ESCALATED");
                    savedClaim.setTriageReason(triageEscalationReason);
                    claimRepository.save(savedClaim);
                    saveClaimHistory(savedClaim, null, triageEscalationReason);
                }
            } else {
                savedClaim.setTriageResult("PENDING");
                savedClaim.setTriageReason("Auto-triage is disabled for this product category.");
                claimRepository.save(savedClaim);
            }
        } else {
            savedClaim.setTriageResult("PENDING");
            savedClaim.setTriageReason("No active triage configuration rule found for category " + policyTypeName);
            claimRepository.save(savedClaim);
        }

        if (savedClaim.getTriageResult().equals("PENDING")) {
            saveClaimHistory(savedClaim, user, "Claim submitted successfully.");
        }

        sendClaimUpdate(savedClaim);

        return mapToClaimResponse(savedClaim);
    }

    public List<ClaimResponse> getMyClaims(UUID userId) {
        return claimRepository.findByUserId(userId).stream()
                .map(this::mapToClaimResponse)
                .collect(Collectors.toList());
    }

    public List<ClaimResponse> getAllClaims() {
        return claimRepository.findAll().stream()
                .map(this::mapToClaimResponse)
                .collect(Collectors.toList());
    }

    public ClaimResponse getClaimById(UUID claimId) {
        Claim claim = claimRepository.findById(claimId)
                .orElseThrow(() -> new ResourceNotFoundException("Claim not found"));
        return mapToClaimResponse(claim);
    }

    @Transactional
    public ClaimResponse updateClaimStatus(UUID claimId, UUID officerId, ClaimStatusUpdateRequest request) {
        Claim claim = claimRepository.findById(claimId)
                .orElseThrow(() -> new ResourceNotFoundException("Claim not found"));
        User officer = userRepository.findById(officerId)
                .orElseThrow(() -> new ResourceNotFoundException("Officer not found"));

        ClaimStatus newStatus = ClaimStatus.valueOf(request.getStatus().toUpperCase());
        if (newStatus == ClaimStatus.APPROVED || newStatus == ClaimStatus.PAID) {
            // KYC periodically verified and refresh check
            if (claim.getUser().getKycStatus() == KycStatus.EXPIRED || claim.getUser().getKycStatus() != KycStatus.VERIFIED) {
                throw new BadRequestException("Payout blocked: KYC verification has expired or is not verified. Please re-verify KYC.");
            }

            List<com.insurance.entity.BankDetails> verifiedAccounts = bankDetailsRepository.findByOwnerIdAndIsVerifiedTrue(claim.getUser().getId());
            if (verifiedAccounts.isEmpty()) {
                throw new BadRequestException("Claim cannot be approved or paid: claimant does not have a verified bank details record.");
            }
            com.insurance.entity.BankDetails primary = verifiedAccounts.stream()
                    .filter(com.insurance.entity.BankDetails::isPrimaryForPayout)
                    .findFirst()
                    .orElse(verifiedAccounts.get(0));

            String rawAcc = com.insurance.util.EncryptionUtil.decrypt(primary.getAccountNumber());
            String maskedAcc = "*".repeat(Math.max(4, rawAcc.length() - 4)) + rawAcc.substring(Math.max(0, rawAcc.length() - 4));
            String payoutNote = String.format("Payout routed to verified bank account: %s at %s (IFSC: %s, Account: %s)",
                    primary.getAccountHolderName(), primary.getBankName(), primary.getIfscCode(), maskedAcc);
            request.setNotes(request.getNotes() != null ? request.getNotes() + " | " + payoutNote : payoutNote);
        }

        claim.setStatus(newStatus);
        if (request.getApprovedAmount() != null) {
            claim.setApprovedAmount(request.getApprovedAmount());
        }
        if (request.getFraudRiskScore() != null) {
            claim.setFraudRiskScore(request.getFraudRiskScore());
        }
        if (request.getFraudReasons() != null) {
            claim.setFraudReasons(request.getFraudReasons());
        }
        claim.setReviewedBy(officer);
        claim.setResolvedAt(LocalDateTime.now());

        Claim saved = claimRepository.save(claim);
        
        saveClaimHistory(saved, officer, request.getNotes() != null ? request.getNotes() : "Status updated to " + request.getStatus());
        sendClaimUpdate(saved);
        
        return mapToClaimResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<ClaimHistoryResponse> getClaimHistory(UUID claimId) {
        return claimHistoryRepository.findByClaimIdOrderByCreatedAtAsc(claimId)
                .stream()
                .map(h -> ClaimHistoryResponse.builder()
                        .id(h.getId())
                        .status(h.getStatus() != null ? h.getStatus().name() : "SUBMITTED")
                        .notes(h.getNotes() != null ? h.getNotes() : "")
                        .updatedBy(h.getUpdatedBy() != null ? h.getUpdatedBy().getFirstName() + " " + h.getUpdatedBy().getLastName() : "System")
                        .createdAt(h.getCreatedAt() != null ? h.getCreatedAt() : LocalDateTime.now())
                        .build())
                .collect(Collectors.toList());
    }

    private void saveClaimHistory(Claim claim, User user, String notes) {
        ClaimHistory history = ClaimHistory.builder()
                .claim(claim)
                .status(claim.getStatus())
                .notes(notes)
                .updatedBy(user)
                .build();
        claimHistoryRepository.save(history);
    }

    private void sendClaimUpdate(Claim claim) {
        ClaimResponse response = mapToClaimResponse(claim);
        messagingTemplate.convertAndSend("/topic/claims/" + claim.getId(), response);
    }

    private ClaimResponse mapToClaimResponse(Claim c) {
        String reviewerName = c.getReviewedBy() != null ? c.getReviewedBy().getFirstName() + " " + c.getReviewedBy().getLastName() : "Pending review";
        List<String> docList = new ArrayList<>();
        if (c.getUploadedClaimDocuments() != null && !c.getUploadedClaimDocuments().isEmpty()) {
            docList = java.util.Arrays.asList(c.getUploadedClaimDocuments().split(","));
        }

        return ClaimResponse.builder()
                .id(c.getId())
                .claimNumber(c.getClaimNumber())
                .customerPolicyId(c.getCustomerPolicy().getId())
                .policyName(c.getCustomerPolicy().getPolicy().getName())
                .userId(c.getUser().getId())
                .userName(c.getUser().getFirstName() + " " + c.getUser().getLastName())
                .claimType(c.getClaimType())
                .description(c.getDescription())
                .claimAmount(c.getClaimAmount())
                .approvedAmount(c.getApprovedAmount())
                .status(c.getStatus().name())
                .fraudRiskScore(c.getFraudRiskScore())
                .fraudReasons(c.getFraudReasons())
                .submittedAt(c.getSubmittedAt())
                .resolvedAt(c.getResolvedAt())
                .reviewedByName(reviewerName)
                .triageResult(c.getTriageResult())
                .triageReason(c.getTriageReason())
                .claimantRelation(c.getClaimantRelation())
                .claimantName(c.getClaimantName())
                .legalHeirVerificationRequired(c.isLegalHeirVerificationRequired())
                .uploadedClaimDocuments(docList)
                .build();
    }
}
