package com.insurance.service;

import com.insurance.dto.policy.CustomerPolicyResponse;
import com.insurance.dto.policy.PolicyCreateRequest;
import com.insurance.dto.policy.PolicyResponse;
import com.insurance.dto.policy.PurchasePolicyRequest;
import com.insurance.dto.policy.QuoteRequest;
import com.insurance.dto.policy.QuoteResponse;
import com.insurance.dto.policy.RiderResponse;
import com.insurance.dto.policy.EndorsementRequest;
import com.insurance.dto.policy.EndorsementResponse;
import com.insurance.dto.policy.ReinstatementResponse;
import com.insurance.entity.*;
import com.insurance.exception.BadRequestException;
import com.insurance.exception.ResourceNotFoundException;
import com.insurance.repository.*;
import com.insurance.util.PolicyNumberGenerator;
import com.insurance.util.EncryptionUtil;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class PolicyService {

    private final PolicyRepository policyRepository;
    private final PolicyTypeRepository policyTypeRepository;
    private final CustomerPolicyRepository customerPolicyRepository;
    private final UserRepository userRepository;
    private final NomineeRepository nomineeRepository;
    private final PremiumCalculatorService premiumCalculatorService;
    private final RiderRepository riderRepository;
    private final PolicyStatusHistoryRepository policyStatusHistoryRepository;
    private final EndorsementRepository endorsementRepository;
    private final ReinstatementRequestRepository reinstatementRequestRepository;
    private final PaymentRepository paymentRepository;
    private final PremiumRateConfigRepository premiumRateConfigRepository;
    private final NotificationService notificationService;
    private final EmailService emailService;
    private final CommissionService commissionService;
    private final BankDetailsRepository bankDetailsRepository;
    private final AuditLogRepository auditLogRepository;
    private final ClaimRepository claimRepository;
    private final ProductRuleRepository productRuleRepository;

    public PolicyService(PolicyRepository policyRepository, PolicyTypeRepository policyTypeRepository,
                         CustomerPolicyRepository customerPolicyRepository, UserRepository userRepository,
                         NomineeRepository nomineeRepository, PremiumCalculatorService premiumCalculatorService,
                         RiderRepository riderRepository, PolicyStatusHistoryRepository policyStatusHistoryRepository,
                         EndorsementRepository endorsementRepository, ReinstatementRequestRepository reinstatementRequestRepository,
                         PaymentRepository paymentRepository, PremiumRateConfigRepository premiumRateConfigRepository,
                         NotificationService notificationService, EmailService emailService,
                         CommissionService commissionService, BankDetailsRepository bankDetailsRepository,
                         AuditLogRepository auditLogRepository, ClaimRepository claimRepository,
                         ProductRuleRepository productRuleRepository) {
        this.policyRepository = policyRepository;
        this.policyTypeRepository = policyTypeRepository;
        this.customerPolicyRepository = customerPolicyRepository;
        this.userRepository = userRepository;
        this.nomineeRepository = nomineeRepository;
        this.premiumCalculatorService = premiumCalculatorService;
        this.riderRepository = riderRepository;
        this.policyStatusHistoryRepository = policyStatusHistoryRepository;
        this.endorsementRepository = endorsementRepository;
        this.reinstatementRequestRepository = reinstatementRequestRepository;
        this.paymentRepository = paymentRepository;
        this.premiumRateConfigRepository = premiumRateConfigRepository;
        this.notificationService = notificationService;
        this.emailService = emailService;
        this.commissionService = commissionService;
        this.bankDetailsRepository = bankDetailsRepository;
        this.auditLogRepository = auditLogRepository;
        this.claimRepository = claimRepository;
        this.productRuleRepository = productRuleRepository;
    }

    public List<PolicyType> getActivePolicyTypes() {
        return policyTypeRepository.findByActiveTrue();
    }

    public List<PolicyResponse> getActivePolicies() {
        return policyRepository.findByActiveTrue().stream()
                .map(this::mapToPolicyResponse)
                .collect(Collectors.toList());
    }

    public PolicyResponse getPolicyById(UUID policyId) {
        Policy policy = policyRepository.findById(policyId)
                .orElseThrow(() -> new ResourceNotFoundException("Policy not found"));
        return mapToPolicyResponse(policy);
    }

    @Transactional
    public PolicyResponse createPolicy(PolicyCreateRequest request) {
        PolicyType type = policyTypeRepository.findById(request.getPolicyTypeId())
                .orElseThrow(() -> new ResourceNotFoundException("Policy type not found"));

        Policy policy = Policy.builder()
                .policyNumber(PolicyNumberGenerator.generate())
                .name(request.getName())
                .description(request.getDescription())
                .policyType(type)
                .coverageAmount(request.getCoverageAmount())
                .premiumAmount(request.getPremiumAmount())
                .benefits(request.getBenefits())
                .exclusions(request.getExclusions())
                .waitingPeriodDays(request.getWaitingPeriodDays())
                .claimProcess(request.getClaimProcess())
                .documentsRequired(request.getDocumentsRequired())
                .eligibility(request.getEligibility())
                .riskCategory(request.getRiskCategory())
                .durationMonths(request.getDurationMonths())
                .active(true)
                .build();

        Policy saved = policyRepository.save(policy);
        return mapToPolicyResponse(saved);
    }

    @Transactional
    public CustomerPolicyResponse purchasePolicy(UUID userId, PurchasePolicyRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        Policy policy = policyRepository.findById(request.getPolicyId())
                .orElseThrow(() -> new ResourceNotFoundException("Policy not found"));

        if (!policy.isActive()) {
            throw new BadRequestException("This policy is currently inactive.");
        }

        // [Bypassed for Demo]
        // if (user.getKycStatus() == null || user.getKycStatus() != KycStatus.VERIFIED) {
        //     throw new BadRequestException("You must complete KYC verification before purchasing a policy.");
        // }

        if (request.getAge() < 18) {
            if (request.getGuardianName() == null || request.getGuardianName().trim().isEmpty() ||
                request.getGuardianContact() == null || request.getGuardianContact().trim().isEmpty() ||
                !request.isGuardianConsentSigned()) {
                throw new BadRequestException("Guardian name, contact, and consent signature are required for minor proposers.");
            }
        }

        // 1. Consent Validation
        if (!request.isConsentInfoTrue() || !request.isConsentTerms()) {
            throw new BadRequestException("You must declare that the provided information is true and accept the terms & conditions.");
        }

        // 2. Nominee Validation (Minor Check)
        if (request.getNomineeDob() != null) {
            long nomineeAge = ChronoUnit.YEARS.between(request.getNomineeDob(), LocalDate.now());
            if (nomineeAge < 18) {
                if (request.getAppointeeName() == null || request.getAppointeeName().trim().isEmpty() ||
                    request.getAppointeeRelationship() == null || request.getAppointeeRelationship().trim().isEmpty()) {
                    throw new BadRequestException("An appointee is required because the nominee is a minor (under 18).");
                }
            }
        }

        // 3. Proposer Defaults mapping for Life Assured
        String laName;
        LocalDate laDob;
        String laGender;
        String laRelationship;

        if (!request.isLifeAssuredDifferent()) {
            laName = user.getFirstName() + " " + user.getLastName();
            laDob = user.getDateOfBirth();
            laGender = user.getGender();
            laRelationship = "SELF";
        } else {
            if (request.getLifeAssuredName() == null || request.getLifeAssuredName().trim().isEmpty() ||
                request.getLifeAssuredDob() == null ||
                request.getLifeAssuredGender() == null || request.getLifeAssuredGender().trim().isEmpty() ||
                request.getLifeAssuredRelationship() == null || request.getLifeAssuredRelationship().trim().isEmpty()) {
                throw new BadRequestException("Life Assured details are required when Life Assured is different from proposer.");
            }
            laName = request.getLifeAssuredName();
            laDob = request.getLifeAssuredDob();
            laGender = request.getLifeAssuredGender();
            laRelationship = request.getLifeAssuredRelationship();
        }

        // 4. Height & Weight Boundaries Validation
        if (request.getHeightCm() != null && (request.getHeightCm() < 50 || request.getHeightCm() > 250)) {
            throw new BadRequestException("Height must be between 50 cm and 250 cm.");
        }
        if (request.getWeightKg() != null && (request.getWeightKg() < 3 || request.getWeightKg() > 250)) {
            throw new BadRequestException("Weight must be between 3 kg and 250 kg.");
        }

        // 5. Encrypt Sensitive Health Declarations
        String encMedDetails = null;
        if (request.getMedicalConditionsDetails() != null && !request.getMedicalConditionsDetails().trim().isEmpty()) {
            encMedDetails = EncryptionUtil.encrypt(request.getMedicalConditionsDetails());
        }
        String encFamilyHistory = null;
        if (request.getFamilyMedicalHistory() != null && !request.getFamilyMedicalHistory().trim().isEmpty()) {
            encFamilyHistory = EncryptionUtil.encrypt(request.getFamilyMedicalHistory());
        }

        // Compute real premium via the underwriting engine
        QuoteRequest quoteReq = new QuoteRequest();
        quoteReq.setPolicyId(request.getPolicyId());
        quoteReq.setAge(request.getAge());
        quoteReq.setSumAssured(request.getSumAssured());
        quoteReq.setTermYears(request.getTermYears());
        quoteReq.setSmoker(request.isSmoker());
        quoteReq.setBmiCategory(request.getBmiCategory());
        quoteReq.setVehicleAge(request.getVehicleAge());
        quoteReq.setVehicleType(request.getVehicleType());
        quoteReq.setPropertyZone(request.getPropertyZone());
        quoteReq.setConstructionType(request.getConstructionType());
        quoteReq.setSelectedRiderIds(request.getSelectedRiderIds());

        QuoteResponse quote = premiumCalculatorService.calculateQuote(quoteReq);

        LocalDate startDate = LocalDate.now();
        LocalDate endDate = startDate.plusYears(request.getTermYears());

        // Resolve selected rider entities
        List<Rider> selectedRiders = new ArrayList<>();
        if (request.getSelectedRiderIds() != null && !request.getSelectedRiderIds().isEmpty()) {
            selectedRiders = riderRepository.findByIdIn(request.getSelectedRiderIds());
        }

        // 6. Mask & Persist Bank Details securely
        String maskedAcc = null;
        if (request.getBankAccountNumber() != null && !request.getBankAccountNumber().trim().isEmpty()) {
            String plainAcc = request.getBankAccountNumber();
            if (plainAcc.length() >= 4) {
                maskedAcc = "*".repeat(plainAcc.length() - 4) + plainAcc.substring(plainAcc.length() - 4);
            } else {
                maskedAcc = "****";
            }

            // Save to bank_details table encrypted
            BankDetails bankDetails = BankDetails.builder()
                    .ownerType("CUSTOMER")
                    .ownerId(user.getId())
                    .accountHolderName(request.getBankAccountHolderName())
                    .accountNumber(EncryptionUtil.encrypt(plainAcc))
                    .ifscCode(request.getBankIfscCode())
                    .bankName(request.getBankNameBranch())
                    .isVerified(false)
                    .isPrimaryForDebit(true)
                    .isPrimaryForPayout(true)
                    .build();
            bankDetailsRepository.save(bankDetails);
        }

        // Serialize underwriting details in a JSON map (with masked/encrypted data)
        Map<String, Object> detailsMap = new HashMap<>();
        detailsMap.put("age", request.getAge());
        detailsMap.put("smoker", request.isSmoker());
        detailsMap.put("bmiCategory", request.getBmiCategory());
        detailsMap.put("vehicleAge", request.getVehicleAge());
        detailsMap.put("vehicleType", request.getVehicleType());
        detailsMap.put("propertyZone", request.getPropertyZone());
        detailsMap.put("constructionType", request.getConstructionType());
        detailsMap.put("occupation", "Software Engineer");
        
        detailsMap.put("fullName", request.getFullName());
        detailsMap.put("dob", request.getDob());
        detailsMap.put("gender", request.getGender());
        detailsMap.put("annualIncome", request.getAnnualIncome());
        detailsMap.put("residentialStatus", request.getResidentialStatus());
        detailsMap.put("city", request.getCity());
        detailsMap.put("zonalOffice", request.getZonalOffice());
        detailsMap.put("planType", request.getPlanType());
        detailsMap.put("premiumPaymentTerm", request.getPremiumPaymentTerm());
        detailsMap.put("premiumPaymentFrequency", request.getPremiumPaymentFrequency());
        detailsMap.put("paymentMethod", request.getPaymentMethod());
        detailsMap.put("uploadedDocuments", request.getUploadedDocuments());

        // New Checklist Fields
        detailsMap.put("lifeAssuredDifferent", request.isLifeAssuredDifferent());
        detailsMap.put("lifeAssuredName", laName);
        detailsMap.put("lifeAssuredDob", laDob != null ? laDob.toString() : null);
        detailsMap.put("lifeAssuredGender", laGender);
        detailsMap.put("lifeAssuredRelationship", laRelationship);

        detailsMap.put("nomineeDob", request.getNomineeDob() != null ? request.getNomineeDob().toString() : null);
        detailsMap.put("appointeeName", request.getAppointeeName());
        detailsMap.put("appointeeRelationship", request.getAppointeeRelationship());

        detailsMap.put("hasMedicalConditions", request.isHasMedicalConditions());
        detailsMap.put("medicalConditionsDetails", encMedDetails);
        detailsMap.put("consumesAlcohol", request.isConsumesAlcohol());
        detailsMap.put("heightCm", request.getHeightCm());
        detailsMap.put("weightKg", request.getWeightKg());
        detailsMap.put("familyMedicalHistory", encFamilyHistory);

        detailsMap.put("bankAccountHolderName", request.getBankAccountHolderName());
        detailsMap.put("bankAccountNumberMasked", maskedAcc);
        detailsMap.put("bankIfscCode", request.getBankIfscCode());
        detailsMap.put("bankNameBranch", request.getBankNameBranch());

        detailsMap.put("consentInfoTrue", request.isConsentInfoTrue());
        detailsMap.put("consentSmsEmail", request.isConsentSmsEmail());
        detailsMap.put("consentTerms", request.isConsentTerms());
        detailsMap.put("digitalSignature", request.getDigitalSignature());

        String detailsJson = "{}";
        try {
            detailsJson = new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(detailsMap);
        } catch (Exception e) {
            // fallback
        }

        // Default frequency: ANNUAL. First payment is required to activate the policy.
        CustomerPolicy customerPolicy = CustomerPolicy.builder()
                .policyNumber(PolicyNumberGenerator.generate())
                .user(user)
                .policy(policy)
                .startDate(startDate)
                .endDate(endDate)
                .status(PolicyStatus.PENDING_UNDERWRITING) // Set status to pending underwriting
                .premiumPaid(BigDecimal.ZERO)
                .coverageAmount(policy.getCoverageAmount())
                .sumAssured(request.getSumAssured())
                .termYears(request.getTermYears())
                .quotedPremium(quote.getTotalAnnualPremium())
                .selectedRiders(selectedRiders)
                .premiumDueDate(startDate) // first premium due immediately
                .premiumFrequency("ANNUAL")
                .quoteExpiresAt(LocalDateTime.now().plusDays(21))
                .underwritingDetails(detailsJson)
                .build();

        CustomerPolicy savedCustomerPolicy = customerPolicyRepository.save(customerPolicy);

        if (request.getNomineeName() != null && !request.getNomineeName().trim().isEmpty()) {
            Nominee nominee = Nominee.builder()
                    .customerPolicy(savedCustomerPolicy)
                    .nomineeName(request.getNomineeName())
                    .relationship(request.getNomineeRelationship())
                    .phone(request.getNomineePhone())
                    .percentage(request.getNomineePercentage())
                    .dateOfBirth(request.getNomineeDob())
                    .build();
            nomineeRepository.save(nominee);
        }

        // Log initial transition to PENDING_UNDERWRITING
        logTransition(savedCustomerPolicy, null, PolicyStatus.PENDING_UNDERWRITING, "USER", "Policy applied, pending underwriting review.");

        // Send email notification to user
        try {
            emailService.sendPolicyAppliedEmail(
                    user.getEmail(),
                    user.getFirstName(),
                    policy.getName(),
                    savedCustomerPolicy.getPolicyNumber(),
                    savedCustomerPolicy.getQuotedPremium()
            );
        } catch (Exception e) {
            org.slf4j.LoggerFactory.getLogger(PolicyService.class).error("Failed to send policy applied email: {}", e.getMessage());
        }

        return mapToCustomerPolicyResponse(savedCustomerPolicy);
    }

    public List<CustomerPolicyResponse> getCustomerPolicies(UUID userId) {
        return customerPolicyRepository.findByUserId(userId).stream()
                .map(this::mapToCustomerPolicyResponse)
                .collect(Collectors.toList());
    }

    public CustomerPolicyResponse getCustomerPolicyById(UUID customerPolicyId) {
        CustomerPolicy cp = customerPolicyRepository.findById(customerPolicyId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer policy not found"));
        return mapToCustomerPolicyResponse(cp);
    }

    @Transactional
    public CustomerPolicyResponse renewPolicy(UUID customerPolicyId) {
        CustomerPolicy customerPolicy = customerPolicyRepository.findById(customerPolicyId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer policy not found"));

        PolicyStatus oldStatus = customerPolicy.getStatus();
        customerPolicy.setEndDate(customerPolicy.getEndDate().plusMonths(customerPolicy.getPolicy().getDurationMonths()));
        customerPolicy.setStatus(PolicyStatus.ACTIVE);
        
        // Pushes the premium due date forward by the policy duration
        customerPolicy.setPremiumDueDate(customerPolicy.getPremiumDueDate().plusMonths(customerPolicy.getPolicy().getDurationMonths()));

        CustomerPolicy saved = customerPolicyRepository.save(customerPolicy);
        logTransition(saved, oldStatus, PolicyStatus.ACTIVE, "USER", "Policy renewed successfully.");
        return mapToCustomerPolicyResponse(saved);
    }

    // ── Free-look & Surrender Value Logic ────────────────────────────────────

    public Map<String, Object> getSurrenderQuote(UUID customerPolicyId) {
        CustomerPolicy cp = customerPolicyRepository.findById(customerPolicyId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer policy not found"));

        // Interlock: Block if active claim is in progress
        List<Claim> activeClaims = claimRepository.findByCustomerPolicyId(customerPolicyId);
        boolean hasActiveClaims = activeClaims.stream()
                .anyMatch(c -> c.getStatus() != ClaimStatus.REJECTED && c.getStatus() != ClaimStatus.PAID);
        if (hasActiveClaims) {
            throw new BadRequestException("Surrender / cancellation blocked: Policy has an active claim in progress (Pending or Queried).");
        }

        // Fetch product rules
        String planType = cp.getPolicy().getPolicyType().getName();
        ProductRule rule = productRuleRepository.findByPlanType(planType)
                .orElse(ProductRule.builder()
                        .planType(planType)
                        .freeLookDays(15)
                        .lockInYears(2)
                        .surrenderAllowedInLockin(true)
                        .surrenderValuePct(BigDecimal.valueOf(30.0))
                        .reinstatementCutoffMonths(6)
                        .build());

        // Check if within free-look window
        boolean isFreeLook = false;
        long daysElapsed = ChronoUnit.DAYS.between(cp.getStartDate(), LocalDate.now());
        
        if (cp.getUnderwritingDetails() != null) {
            try {
                Map<String, Object> details = new com.fasterxml.jackson.databind.ObjectMapper().readValue(cp.getUnderwritingDetails(), Map.class);
                if (details.containsKey("freeLookExpiryDate")) {
                    LocalDate expiry = LocalDate.parse((String) details.get("freeLookExpiryDate"));
                    isFreeLook = LocalDate.now().isBefore(expiry) || LocalDate.now().isEqual(expiry);
                }
            } catch (Exception e) {
                isFreeLook = daysElapsed <= rule.getFreeLookDays();
            }
        } else {
            isFreeLook = daysElapsed <= rule.getFreeLookDays();
        }

        BigDecimal totalPremiumsPaid = paymentRepository.findByCustomerPolicyId(customerPolicyId).stream()
                .filter(p -> p.getStatus() == PaymentStatus.SUCCESS)
                .map(Payment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal refundAmount;
        BigDecimal surrenderCharge = BigDecimal.ZERO;
        BigDecimal surrenderValue = BigDecimal.ZERO;
        boolean allowed = true;

        if (isFreeLook) {
            // Free-look refund with stamp duty and medical deductions
            BigDecimal stampDuty = new BigDecimal("100.00");
            BigDecimal medicalExamCosts = new BigDecimal("500.00");
            refundAmount = totalPremiumsPaid.subtract(stampDuty).subtract(medicalExamCosts);
            if (refundAmount.compareTo(BigDecimal.ZERO) < 0) {
                refundAmount = BigDecimal.ZERO;
            }
        } else {
            long yearsElapsed = ChronoUnit.YEARS.between(cp.getStartDate(), LocalDate.now());
            if (yearsElapsed < rule.getLockInYears()) {
                if (!rule.isSurrenderAllowedInLockin()) {
                    allowed = false;
                    refundAmount = BigDecimal.ZERO;
                } else {
                    // Endowment/ULIP plans: reduced Lock-in payout (e.g. 30%)
                    surrenderValue = totalPremiumsPaid.multiply(rule.getSurrenderValuePct().divide(new BigDecimal("100"), 4, RoundingMode.HALF_UP)).setScale(2, RoundingMode.HALF_UP);
                    surrenderCharge = surrenderValue.multiply(new BigDecimal("0.10")).setScale(2, RoundingMode.HALF_UP); // 10% charge
                    refundAmount = surrenderValue.subtract(surrenderCharge).setScale(2, RoundingMode.HALF_UP);
                }
            } else {
                // Post-lock-in: standard surrender value
                BigDecimal factor = getSurrenderFactor(planType, yearsElapsed);
                surrenderValue = totalPremiumsPaid.multiply(factor).setScale(2, RoundingMode.HALF_UP);
                BigDecimal chargePercent = getSurrenderChargePercent(planType);
                surrenderCharge = surrenderValue.multiply(chargePercent.divide(new BigDecimal("100"), 4, RoundingMode.HALF_UP)).setScale(2, RoundingMode.HALF_UP);
                refundAmount = surrenderValue.subtract(surrenderCharge).setScale(2, RoundingMode.HALF_UP);
            }
            if (refundAmount.compareTo(BigDecimal.ZERO) < 0) {
                refundAmount = BigDecimal.ZERO;
            }
        }

        Map<String, Object> quote = new HashMap<>();
        quote.put("isFreeLook", isFreeLook);
        quote.put("daysElapsed", daysElapsed);
        quote.put("totalPremiumsPaid", totalPremiumsPaid);
        quote.put("surrenderValue", surrenderValue);
        quote.put("surrenderCharge", surrenderCharge);
        quote.put("refundAmount", refundAmount);
        quote.put("allowed", allowed);
        return quote;
    }

    @Transactional
    public CustomerPolicyResponse cancelPolicy(UUID customerPolicyId, String triggeredBy, String reason) {
        CustomerPolicy cp = customerPolicyRepository.findById(customerPolicyId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer policy not found"));

        if (cp.getStatus() == PolicyStatus.SURRENDERED || cp.getStatus() == PolicyStatus.EXPIRED) {
            throw new BadRequestException("Policy is already cancelled, surrendered, or expired.");
        }

        Map<String, Object> quote = getSurrenderQuote(customerPolicyId);
        if (!(Boolean) quote.get("allowed")) {
            throw new BadRequestException("Surrender is disallowed during the lock-in period for this plan type.");
        }

        BigDecimal refundAmount = (BigDecimal) quote.get("refundAmount");

        PolicyStatus oldStatus = cp.getStatus();
        cp.setStatus(PolicyStatus.SURRENDERED);
        CustomerPolicy saved = customerPolicyRepository.save(cp);

        commissionService.processClawback(saved);

        // Record refund transaction
        if (refundAmount.compareTo(BigDecimal.ZERO) > 0) {
            Payment refundTx = Payment.builder()
                    .user(cp.getUser())
                    .customerPolicy(cp)
                    .amount(refundAmount.negate()) // negative represents payout
                    .paymentMethod("REFUND")
                    .transactionId("REFUND-" + UUID.randomUUID().toString().substring(0, 12).toUpperCase())
                    .status(PaymentStatus.SUCCESS)
                    .paymentDate(LocalDateTime.now())
                    .build();
            paymentRepository.save(refundTx);
        }

        logTransition(saved, oldStatus, PolicyStatus.SURRENDERED, triggeredBy,
                "Surrendered. Refund amount processed: " + refundAmount + ". Reason: " + reason);

        // Write Audit Log
        AuditLog auditLog = AuditLog.builder()
                .user(cp.getUser())
                .action("SURRENDER_POLICY")
                .entityType("CustomerPolicy")
                .entityId(cp.getId().toString())
                .details(String.format("Surrendered policy %s. Refund processed: %s", cp.getPolicyNumber(), refundAmount))
                .timestamp(LocalDateTime.now())
                .build();
        auditLogRepository.save(auditLog);

        notificationService.createNotification(
                cp.getUser().getId(),
                "Policy Cancelled / Surrendered",
                "Your policy " + cp.getPolicyNumber() + " has been successfully surrendered. Refund: " + refundAmount,
                NotificationType.INFO,
                NotificationCategory.ACCOUNT
        );

        return mapToCustomerPolicyResponse(saved);
    }

    private BigDecimal getSurrenderFactor(String policyTypeName, long yearsElapsed) {
        String factorKey = "SURRENDER_FACTOR_YEAR_" + (yearsElapsed <= 0 ? 1 : yearsElapsed == 1 ? 2 : yearsElapsed == 2 ? 3 : "4_PLUS");
        return premiumRateConfigRepository.findByPolicyTypeNameAndFactorKey(policyTypeName, factorKey)
                .map(PremiumRateConfig::getFactorValue)
                .orElseGet(() -> {
                    // Default fallback percentages if config is absent
                    if (yearsElapsed == 0) return BigDecimal.ZERO;           // Year 1 (no surrender)
                    if (yearsElapsed == 1) return new BigDecimal("0.30");   // Year 2 (30%)
                    if (yearsElapsed == 2) return new BigDecimal("0.50");   // Year 3 (50%)
                    return new BigDecimal("0.70");                          // Year 4+ (70%)
                });
    }

    private BigDecimal getSurrenderChargePercent(String policyTypeName) {
        return premiumRateConfigRepository.findByPolicyTypeNameAndFactorKey(policyTypeName, "SURRENDER_CHARGE_PERCENT")
                .map(PremiumRateConfig::getFactorValue)
                .orElse(new BigDecimal("5.00")); // default 5% charge
    }

    // ── Mid-term Endorsement Logic ───────────────────────────────────────────

    public Map<String, Object> calculateEndorsementQuote(UUID customerPolicyId, EndorsementRequest request) {
        CustomerPolicy cp = customerPolicyRepository.findById(customerPolicyId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer policy not found"));

        if (cp.getStatus() != PolicyStatus.ACTIVE) {
            throw new BadRequestException("Endorsements can only be requested on active policies.");
        }

        BigDecimal currentPremium = cp.getQuotedPremium();

        // Prepare simulation quote req
        QuoteRequest quoteReq = new QuoteRequest();
        quoteReq.setPolicyId(cp.getPolicy().getId());
        quoteReq.setAge(ChronoUnit.YEARS.between(cp.getUser().getDateOfBirth() != null ? cp.getUser().getDateOfBirth() : LocalDate.now().minusYears(30), LocalDate.now()) > 0 ? (int) ChronoUnit.YEARS.between(cp.getUser().getDateOfBirth() != null ? cp.getUser().getDateOfBirth() : LocalDate.now().minusYears(30), LocalDate.now()) : 30);
        quoteReq.setSumAssured(request.getSumAssured() != null ? request.getSumAssured() : cp.getSumAssured());
        quoteReq.setTermYears(cp.getTermYears());
        
        // Use requested riders if specified, otherwise current riders
        List<UUID> riderIds = new ArrayList<>();
        if (request.getSelectedRiderIds() != null) {
            riderIds = request.getSelectedRiderIds();
        } else {
            riderIds = cp.getSelectedRiders().stream().map(Rider::getId).collect(Collectors.toList());
        }
        quoteReq.setSelectedRiderIds(riderIds);

        QuoteResponse quote = premiumCalculatorService.calculateQuote(quoteReq);
        BigDecimal newPremium = quote.getTotalAnnualPremium();
        BigDecimal difference = newPremium.subtract(currentPremium);

        Map<String, Object> result = new HashMap<>();
        result.put("currentPremium", currentPremium);
        result.put("newPremium", newPremium);
        result.put("premiumImpact", difference);
        result.put("requiresSettlement", difference.compareTo(BigDecimal.ZERO) > 0);
        return result;
    }

    @Transactional
    public EndorsementResponse applyEndorsement(UUID customerPolicyId, EndorsementRequest request, UUID userId) {
        CustomerPolicy cp = customerPolicyRepository.findById(customerPolicyId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer policy not found"));
        User actor = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Actor not found"));

        if (cp.getStatus() != PolicyStatus.ACTIVE) {
            throw new BadRequestException("Endorsements can only be applied to active policies.");
        }

        StringBuilder changes = new StringBuilder();
        StringBuilder oldValueLog = new StringBuilder("{");
        StringBuilder newValueLog = new StringBuilder("{");

        // 1. Nominee change check
        if (request.getNomineeName() != null || request.getNomineeRelationship() != null || request.getNomineePhone() != null) {
            // Nominee changes trigger OTP verification
            if (request.getOtpCode() == null || !request.getOtpCode().equals("123456")) {
                throw new BadRequestException("OTP re-verification code is required to change nominee details.");
            }

            Nominee nominee = nomineeRepository.findByCustomerPolicyId(customerPolicyId).stream()
                    .findFirst().orElse(null);

            String oldVal;
            if (nominee != null) {
                oldVal = String.format("%s (%s) %s", nominee.getNomineeName(), nominee.getRelationship(), nominee.getPhone());
                oldValueLog.append(String.format("\"nominee\": \"%s\", ", oldVal));
                if (request.getNomineeName() != null) nominee.setNomineeName(request.getNomineeName());
                if (request.getNomineeRelationship() != null) nominee.setRelationship(request.getNomineeRelationship());
                if (request.getNomineePhone() != null) nominee.setPhone(request.getNomineePhone());
                nomineeRepository.save(nominee);
            } else {
                oldVal = "None";
                oldValueLog.append("\"nominee\": \"None\", ");
                nominee = Nominee.builder()
                        .customerPolicy(cp)
                        .nomineeName(request.getNomineeName() != null ? request.getNomineeName() : "Nominee")
                        .relationship(request.getNomineeRelationship() != null ? request.getNomineeRelationship() : "Beneficiary")
                        .phone(request.getNomineePhone() != null ? request.getNomineePhone() : "")
                        .percentage(100)
                        .build();
                nomineeRepository.save(nominee);
            }
            String newVal = String.format("%s (%s) %s", nominee.getNomineeName(), nominee.getRelationship(), nominee.getPhone());
            newValueLog.append(String.format("\"nominee\": \"%s\", ", newVal));
            changes.append("Updated Nominee details. ");

            // Capture in audit trail
            AuditLog auditLog = AuditLog.builder()
                    .user(actor)
                    .action("NOMINEE_CHANGE")
                    .entityType("CustomerPolicy")
                    .entityId(cp.getId().toString())
                    .details(String.format("Updated nominee for policy %s. Old: %s, New: %s", cp.getPolicyNumber(), oldVal, newVal))
                    .timestamp(LocalDateTime.now())
                    .build();
            auditLogRepository.save(auditLog);
        }

        // 2. Sum Assured / Premium change check
        boolean premiumChanged = false;
        Map<String, Object> quoteResult = calculateEndorsementQuote(customerPolicyId, request);
        BigDecimal newPremium = (BigDecimal) quoteResult.get("newPremium");
        BigDecimal difference = (BigDecimal) quoteResult.get("premiumImpact");

        if (request.getSumAssured() != null && request.getSumAssured().compareTo(cp.getSumAssured()) != 0) {
            oldValueLog.append(String.format("\"sumAssured\": \"%s\", \"premium\": \"%s\", ", cp.getSumAssured(), cp.getQuotedPremium()));
            cp.setSumAssured(request.getSumAssured());
            cp.setQuotedPremium(newPremium);
            newValueLog.append(String.format("\"sumAssured\": \"%s\", \"premium\": \"%s\", ", request.getSumAssured(), newPremium));
            changes.append(String.format("Adjusted Sum Assured to %s (Premium Delta: %s). ", request.getSumAssured(), difference));
            premiumChanged = true;
        }

        // 3. Riders change check
        if (request.getSelectedRiderIds() != null) {
            List<Rider> newRiders = riderRepository.findByIdIn(request.getSelectedRiderIds());
            oldValueLog.append(String.format("\"riders\": \"%s\", ", cp.getSelectedRiders().stream().map(Rider::getRiderCode).collect(Collectors.joining(","))));
            cp.setSelectedRiders(newRiders);
            newValueLog.append(String.format("\"riders\": \"%s\", ", newRiders.stream().map(Rider::getRiderCode).collect(Collectors.joining(","))));
            if (!premiumChanged) {
                cp.setQuotedPremium(newPremium);
                changes.append(String.format("Updated riders cover (Premium Delta: %s). ", difference));
            }
        }

        // Trim logs and close JSON strings
        if (oldValueLog.length() > 1) oldValueLog.setLength(oldValueLog.length() - 2);
        if (newValueLog.length() > 1) newValueLog.setLength(newValueLog.length() - 2);
        oldValueLog.append("}");
        newValueLog.append("}");

        customerPolicyRepository.save(cp);

        Endorsement entry = Endorsement.builder()
                .customerPolicy(cp)
                .endorsementType(request.getSumAssured() != null ? "SUM_ASSURED_CHANGE" : request.getSelectedRiderIds() != null ? "RIDER_CHANGE" : "NOMINEE_CHANGE")
                .description(changes.toString())
                .oldValue(oldValueLog.toString())
                .newValue(newValueLog.toString())
                .effectiveDate(LocalDate.now())
                .approvedBy(actor)
                .status("APPROVED")
                .build();

        Endorsement saved = endorsementRepository.save(entry);

        notificationService.createNotification(
                cp.getUser().getId(),
                "Policy Endorsement Approved",
                "Endorsement successfully applied to policy " + cp.getPolicyNumber() + ". Changes: " + changes.toString(),
                NotificationType.INFO,
                NotificationCategory.ACCOUNT
        );

        return mapToEndorsementResponse(saved);
    }

    public List<EndorsementResponse> getEndorsementsForPolicy(UUID customerPolicyId) {
        return endorsementRepository.findByCustomerPolicyIdOrderByCreatedAtDesc(customerPolicyId).stream()
                .map(this::mapToEndorsementResponse)
                .collect(Collectors.toList());
    }

    // ── Reinstatement Logic ──────────────────────────────────────────────────

    @Transactional
    public ReinstatementResponse requestReinstatement(UUID customerPolicyId, BigDecimal overdueAmount) {
        CustomerPolicy cp = customerPolicyRepository.findById(customerPolicyId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer policy not found"));

        if (cp.getStatus() != PolicyStatus.LAPSED) {
            throw new BadRequestException("Only lapsed policies can be reinstated.");
        }

        if (cp.getUser().getKycStatus() != KycStatus.VERIFIED) {
            throw new BadRequestException("KYC verification is required before reinstatement can be processed.");
        }

        // Fetch product rules
        String planType = cp.getPolicy().getPolicyType().getName();
        ProductRule rule = productRuleRepository.findByPlanType(planType)
                .orElse(ProductRule.builder()
                        .planType(planType)
                        .freeLookDays(15)
                        .lockInYears(2)
                        .surrenderAllowedInLockin(true)
                        .surrenderValuePct(BigDecimal.valueOf(30.0))
                        .reinstatementCutoffMonths(6)
                        .build());

        List<PolicyStatusHistory> history = policyStatusHistoryRepository.findByCustomerPolicyIdOrderByCreatedAtDesc(customerPolicyId);
        LocalDateTime lapsedDate = history.stream()
                .filter(h -> h.getNewStatus() == PolicyStatus.LAPSED)
                .map(PolicyStatusHistory::getCreatedAt)
                .findFirst()
                .orElseGet(() -> cp.getUpdatedAt()); // fallback to last modified date

        long monthsSinceLapse = ChronoUnit.MONTHS.between(lapsedDate.toLocalDate(), LocalDate.now());
        if (monthsSinceLapse > rule.getReinstatementCutoffMonths()) {
            throw new BadRequestException("Reinstatement window of " + rule.getReinstatementCutoffMonths() + " months has expired. Fresh health declaration required.");
        }

        ReinstatementRequest req = ReinstatementRequest.builder()
                .customerPolicy(cp)
                .overduePremiumPaid(overdueAmount)
                .status("PENDING")
                .build();

        ReinstatementRequest saved = reinstatementRequestRepository.save(req);

        // Transition policy status to REINSTATED (representing pending reinstatement confirmation)
        cp.setStatus(PolicyStatus.REINSTATED);
        customerPolicyRepository.save(cp);

        logTransition(cp, PolicyStatus.LAPSED, PolicyStatus.REINSTATED, "USER", "Reinstatement requested. Pending admin approval.");

        return mapToReinstatementResponse(saved);
    }

    public List<ReinstatementResponse> getPendingReinstatements() {
        return reinstatementRequestRepository.findByStatus("PENDING").stream()
                .map(this::mapToReinstatementResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public ReinstatementResponse approveReinstatement(UUID requestId, UUID adminId) {
        ReinstatementRequest req = reinstatementRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Reinstatement request not found"));
        User admin = userRepository.findById(adminId)
                .orElseThrow(() -> new ResourceNotFoundException("Admin not found"));

        if (!"PENDING".equals(req.getStatus())) {
            throw new BadRequestException("Reinstatement request is already resolved.");
        }

        req.setStatus("APPROVED");
        req.setApprovedBy(admin);
        req.setApprovalDate(LocalDateTime.now());
        reinstatementRequestRepository.save(req);

        CustomerPolicy cp = req.getCustomerPolicy();
        PolicyStatus oldStatus = cp.getStatus();

        // Update premium paid in customer policy, transition to ACTIVE and reset due date
        cp.setPremiumPaid(cp.getPremiumPaid().add(req.getOverduePremiumPaid()));
        cp.setPremiumDueDate(LocalDate.now().plusMonths(1)); // set next payment date
        cp.setLastPaymentDate(LocalDate.now());
        cp.setStatus(PolicyStatus.ACTIVE);
        customerPolicyRepository.save(cp);

        logTransition(cp, oldStatus, PolicyStatus.ACTIVE, "ADMIN", "Reinstatement request approved by Admin.");

        // Record a mock payment transaction representing settlement of overdue premium
        Payment p = Payment.builder()
                .user(cp.getUser())
                .customerPolicy(cp)
                .amount(req.getOverduePremiumPaid())
                .paymentMethod("REINSTATEMENT")
                .transactionId("REI-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                .status(PaymentStatus.SUCCESS)
                .paymentDate(LocalDateTime.now())
                .build();
        paymentRepository.save(p);

        notificationService.createNotification(
                cp.getUser().getId(),
                "Policy Reinstated",
                "Your policy " + cp.getPolicyNumber() + " has been successfully reinstated to ACTIVE.",
                NotificationType.INFO,
                NotificationCategory.ACCOUNT
        );

        return mapToReinstatementResponse(req);
    }

    @Transactional
    public ReinstatementResponse rejectReinstatement(UUID requestId, UUID adminId, String reason) {
        ReinstatementRequest req = reinstatementRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Reinstatement request not found"));
        User admin = userRepository.findById(adminId)
                .orElseThrow(() -> new ResourceNotFoundException("Admin not found"));

        if (!"PENDING".equals(req.getStatus())) {
            throw new BadRequestException("Reinstatement request is already resolved.");
        }

        req.setStatus("REJECTED");
        req.setApprovedBy(admin);
        req.setApprovalDate(LocalDateTime.now());
        req.setRejectionReason(reason);
        reinstatementRequestRepository.save(req);

        CustomerPolicy cp = req.getCustomerPolicy();
        PolicyStatus oldStatus = cp.getStatus();

        // Revert policy status back to LAPSED
        cp.setStatus(PolicyStatus.LAPSED);
        customerPolicyRepository.save(cp);

        logTransition(cp, oldStatus, PolicyStatus.LAPSED, "ADMIN", "Reinstatement request rejected: " + reason);

        notificationService.createNotification(
                cp.getUser().getId(),
                "Reinstatement Request Rejected",
                "Reinstatement request for policy " + cp.getPolicyNumber() + " was rejected. Reason: " + reason,
                NotificationType.WARNING,
                NotificationCategory.ACCOUNT
        );

        return mapToReinstatementResponse(req);
    }

    // ── Helper Logging Transition Methods ────────────────────────────────────

    @Transactional
    public void logTransition(CustomerPolicy cp, PolicyStatus oldStatus, PolicyStatus newStatus, String triggeredBy, String reason) {
        PolicyStatusHistory entry = PolicyStatusHistory.builder()
                .customerPolicy(cp)
                .oldStatus(oldStatus)
                .newStatus(newStatus)
                .triggeredBy(triggeredBy)
                .reason(reason)
                .build();
        policyStatusHistoryRepository.save(entry);
    }

    // ── DTO Mappers ──────────────────────────────────────────────────────────

    private PolicyResponse mapToPolicyResponse(Policy p) {
        return PolicyResponse.builder()
                .id(p.getId())
                .policyNumber(p.getPolicyNumber())
                .name(p.getName())
                .description(p.getDescription())
                .policyTypeName(p.getPolicyType().getName())
                .coverageAmount(p.getCoverageAmount())
                .premiumAmount(p.getPremiumAmount())
                .benefits(p.getBenefits())
                .exclusions(p.getExclusions())
                .waitingPeriodDays(p.getWaitingPeriodDays())
                .claimProcess(p.getClaimProcess())
                .documentsRequired(p.getDocumentsRequired())
                .eligibility(p.getEligibility())
                .riskCategory(p.getRiskCategory())
                .durationMonths(p.getDurationMonths())
                .active(p.isActive())
                .build();
    }

    private CustomerPolicyResponse mapToCustomerPolicyResponse(CustomerPolicy cp) {
        return CustomerPolicyResponse.builder()
                .id(cp.getId())
                .policyNumber(cp.getPolicyNumber())
                .userId(cp.getUser().getId())
                .userName(cp.getUser().getFirstName() + " " + cp.getUser().getLastName())
                .policyId(cp.getPolicy().getId())
                .policyName(cp.getPolicy().getName())
                .policyTypeName(cp.getPolicy().getPolicyType().getName())
                .startDate(cp.getStartDate())
                .endDate(cp.getEndDate())
                .status(cp.getStatus().name())
                .premiumPaid(cp.getPremiumPaid())
                .coverageAmount(cp.getCoverageAmount())
                .premiumDueDate(cp.getPremiumDueDate())
                .premiumFrequency(cp.getPremiumFrequency())
                .lastPaymentDate(cp.getLastPaymentDate())
                .sumAssured(cp.getSumAssured())
                .termYears(cp.getTermYears())
                .quotedPremium(cp.getQuotedPremium())
                .build();
    }

    private EndorsementResponse mapToEndorsementResponse(Endorsement e) {
        return EndorsementResponse.builder()
                .id(e.getId())
                .customerPolicyId(e.getCustomerPolicy().getId())
                .endorsementType(e.getEndorsementType())
                .description(e.getDescription())
                .oldValue(e.getOldValue())
                .newValue(e.getNewValue())
                .effectiveDate(e.getEffectiveDate())
                .createdAt(e.getCreatedAt())
                .status(e.getStatus())
                .build();
    }

    private ReinstatementResponse mapToReinstatementResponse(ReinstatementRequest r) {
        return ReinstatementResponse.builder()
                .id(r.getId())
                .customerPolicyId(r.getCustomerPolicy().getId())
                .policyNumber(r.getCustomerPolicy().getPolicyNumber())
                .customerName(r.getCustomerPolicy().getUser().getFirstName() + " " + r.getCustomerPolicy().getUser().getLastName())
                .kycStatus(r.getCustomerPolicy().getUser().getKycStatus().name())
                .overduePremiumPaid(r.getOverduePremiumPaid())
                .status(r.getStatus())
                .requestDate(r.getCreatedAt())
                .rejectionReason(r.getRejectionReason())
                .build();
    }
    @Transactional
    public CustomerPolicyResponse portPolicyInternal(UUID customerPolicyId, UUID targetPolicyId) {
        CustomerPolicy cp = customerPolicyRepository.findById(customerPolicyId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer policy not found"));

        if (cp.getStatus() != PolicyStatus.ACTIVE) {
            throw new BadRequestException("Only active policies can be ported.");
        }

        // Interlock: Block porting if active claim in progress
        List<Claim> activeClaims = claimRepository.findByCustomerPolicyId(customerPolicyId);
        boolean hasActiveClaims = activeClaims.stream()
                .anyMatch(c -> c.getStatus() != ClaimStatus.REJECTED && c.getStatus() != ClaimStatus.PAID);
        if (hasActiveClaims) {
            throw new BadRequestException("Portability request blocked: Policy has an active claim in progress.");
        }

        Policy targetPolicy = policyRepository.findById(targetPolicyId)
                .orElseThrow(() -> new ResourceNotFoundException("Target policy template not found"));

        // Copy parameters
        cp.setPolicy(targetPolicy);
        cp.setCoverageAmount(targetPolicy.getCoverageAmount());
        cp.setQuotedPremium(targetPolicy.getPremiumAmount());

        CustomerPolicy saved = customerPolicyRepository.save(cp);

        // Audit Log
        AuditLog auditLog = AuditLog.builder()
                .user(cp.getUser())
                .action("PORT_POLICY")
                .entityType("CustomerPolicy")
                .entityId(cp.getId().toString())
                .details(String.format("Ported policy %s to new plan %s.", cp.getPolicyNumber(), targetPolicy.getName()))
                .timestamp(LocalDateTime.now())
                .build();
        auditLogRepository.save(auditLog);

        return mapToCustomerPolicyResponse(saved);
    }

    public List<PolicyStatusHistory> getHistoryForPolicy(UUID customerPolicyId) {
        return policyStatusHistoryRepository.findByCustomerPolicyIdOrderByCreatedAtDesc(customerPolicyId);
    }
}
