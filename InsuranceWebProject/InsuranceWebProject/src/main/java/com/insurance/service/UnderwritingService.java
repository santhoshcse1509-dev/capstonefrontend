package com.insurance.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.insurance.dto.policy.UnderwritingApplicationResponse;
import com.insurance.entity.*;
import com.insurance.exception.ResourceNotFoundException;
import com.insurance.repository.AuditLogRepository;
import com.insurance.repository.CustomerPolicyRepository;
import com.insurance.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class UnderwritingService {

    private static final Logger log = LoggerFactory.getLogger(UnderwritingService.class);

    private final CustomerPolicyRepository customerPolicyRepository;
    private final UserRepository userRepository;
    private final AuditLogRepository auditLogRepository;
    private final ObjectMapper objectMapper;

    public UnderwritingService(CustomerPolicyRepository customerPolicyRepository,
                               UserRepository userRepository,
                               AuditLogRepository auditLogRepository,
                               ObjectMapper objectMapper) {
        this.customerPolicyRepository = customerPolicyRepository;
        this.userRepository = userRepository;
        this.auditLogRepository = auditLogRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional(readOnly = true)
    public List<UnderwritingApplicationResponse> getApplicationQueue() {
        List<PolicyStatus> statuses = Arrays.asList(
                PolicyStatus.PENDING_UNDERWRITING,
                PolicyStatus.ESCALATED,
                PolicyStatus.REJECTED,
                PolicyStatus.PENDING_PAYMENT,
                PolicyStatus.ACTIVE
        );

        return customerPolicyRepository.findByStatusIn(statuses).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public UnderwritingApplicationResponse getApplicationById(UUID id) {
        CustomerPolicy policy = customerPolicyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Application not found: " + id));
        return mapToResponse(policy);
    }

    public void approveApplication(UUID id, UUID adminId) {
        CustomerPolicy policy = customerPolicyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Application not found: " + id));

        User admin = userRepository.findById(adminId)
                .orElseThrow(() -> new ResourceNotFoundException("Admin not found: " + adminId));

        PolicyStatus oldStatus = policy.getStatus();
        policy.setStatus(PolicyStatus.PENDING_PAYMENT);
        customerPolicyRepository.save(policy);

        // Record Audit Log
        AuditLog auditLog = AuditLog.builder()
                .user(admin)
                .action("APPROVE_UNDERWRITING")
                .entityType("CustomerPolicy")
                .entityId(policy.getId().toString())
                .details(String.format("Approved underwriting for policy %s. Status changed from %s to PENDING_PAYMENT", 
                        policy.getPolicyNumber(), oldStatus))
                .timestamp(LocalDateTime.now())
                .build();
        auditLogRepository.save(auditLog);

        log.info("Underwriting approved for policy {} by admin {}", policy.getPolicyNumber(), adminId);
    }

    public void rejectApplication(UUID id, UUID adminId, String reason) {
        CustomerPolicy policy = customerPolicyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Application not found: " + id));

        User admin = userRepository.findById(adminId)
                .orElseThrow(() -> new ResourceNotFoundException("Admin not found: " + adminId));

        PolicyStatus oldStatus = policy.getStatus();
        policy.setStatus(PolicyStatus.REJECTED);
        policy.setRejectionReason(reason);
        customerPolicyRepository.save(policy);

        // Record Audit Log
        AuditLog auditLog = AuditLog.builder()
                .user(admin)
                .action("REJECT_UNDERWRITING")
                .entityType("CustomerPolicy")
                .entityId(policy.getId().toString())
                .details(String.format("Rejected underwriting for policy %s. Reason: %s. Status changed from %s to REJECTED", 
                        policy.getPolicyNumber(), reason, oldStatus))
                .timestamp(LocalDateTime.now())
                .build();
        auditLogRepository.save(auditLog);

        log.info("Underwriting rejected for policy {} by admin {}. Reason: {}", policy.getPolicyNumber(), adminId, reason);
    }

    public void escalateApplication(UUID id, UUID adminId) {
        CustomerPolicy policy = customerPolicyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Application not found: " + id));

        User admin = userRepository.findById(adminId)
                .orElseThrow(() -> new ResourceNotFoundException("Admin not found: " + adminId));

        PolicyStatus oldStatus = policy.getStatus();
        policy.setStatus(PolicyStatus.ESCALATED);
        customerPolicyRepository.save(policy);

        // Record Audit Log
        AuditLog auditLog = AuditLog.builder()
                .user(admin)
                .action("ESCALATE_UNDERWRITING")
                .entityType("CustomerPolicy")
                .entityId(policy.getId().toString())
                .details(String.format("Escalated policy %s to Chief Underwriter. Status changed from %s to ESCALATED", 
                        policy.getPolicyNumber(), oldStatus))
                .timestamp(LocalDateTime.now())
                .build();
        auditLogRepository.save(auditLog);

        log.info("Underwriting escalated for policy {} by admin {}", policy.getPolicyNumber(), adminId);
    }

    private UnderwritingApplicationResponse mapToResponse(CustomerPolicy cp) {
        Integer age = null;
        String occupation = "Standard Risk";
        String medicalHistory = "No pre-existing conditions reported";

        if (cp.getUnderwritingDetails() != null) {
            try {
                Map<String, Object> details = objectMapper.readValue(cp.getUnderwritingDetails(), Map.class);
                if (details.containsKey("age")) {
                    age = ((Number) details.get("age")).intValue();
                }
                if (details.containsKey("occupation")) {
                    occupation = (String) details.get("occupation");
                }
                if (details.containsKey("medicalHistory")) {
                    medicalHistory = (String) details.get("medicalHistory");
                }
            } catch (Exception e) {
                log.error("Failed to parse underwriting details JSON for policy {}", cp.getPolicyNumber(), e);
            }
        }

        // Map status for frontend:
        // PENDING_UNDERWRITING -> PENDING
        // ESCALATED -> ESCALATED
        // REJECTED -> REJECTED
        // PENDING_PAYMENT / ACTIVE / any other -> APPROVED
        String mappedStatus = "APPROVED";
        if (cp.getStatus() == PolicyStatus.PENDING_UNDERWRITING) {
            mappedStatus = "PENDING";
        } else if (cp.getStatus() == PolicyStatus.ESCALATED) {
            mappedStatus = "ESCALATED";
        } else if (cp.getStatus() == PolicyStatus.REJECTED) {
            mappedStatus = "REJECTED";
        }

        // Calculate a mock risk score from inputs if not explicitly configured
        int riskScore = calculateRiskScore(cp);

        return UnderwritingApplicationResponse.builder()
                .id(cp.getId())
                .appId(cp.getPolicyNumber())
                .applicantName(cp.getUser().getFirstName() + " " + cp.getUser().getLastName())
                .product(cp.getPolicy().getName())
                .sumAssured(cp.getSumAssured())
                .riskScore(riskScore)
                .submittedAt(cp.getCreatedAt())
                .status(mappedStatus)
                .age(age != null ? age : 30)
                .occupation(occupation)
                .medicalHistory(medicalHistory)
                .rejectionReason(cp.getRejectionReason())
                .underwritingDetailsJson(cp.getUnderwritingDetails())
                .build();
    }

    private int calculateRiskScore(CustomerPolicy cp) {
        int score = 20; // base score
        if (cp.getUnderwritingDetails() != null) {
            try {
                Map<String, Object> details = objectMapper.readValue(cp.getUnderwritingDetails(), Map.class);
                if (details.containsKey("smoker") && (Boolean) details.get("smoker")) {
                    score += 25;
                }
                if (details.containsKey("bmiCategory")) {
                    String bmi = (String) details.get("bmiCategory");
                    if ("OBESE".equalsIgnoreCase(bmi)) {
                        score += 20;
                    } else if ("UNDERWEIGHT".equalsIgnoreCase(bmi)) {
                        score += 10;
                    }
                }
                if (details.containsKey("age")) {
                    int age = ((Number) details.get("age")).intValue();
                    if (age > 50) {
                        score += 20;
                    } else if (age > 35) {
                        score += 10;
                    }
                }
                if (details.containsKey("propertyZone")) {
                    String zone = (String) details.get("propertyZone");
                    if ("HIGH_RISK".equalsIgnoreCase(zone)) {
                        score += 15;
                    }
                }
            } catch (Exception e) {
                // Ignore parsing errors, return base score
            }
        }
        return Math.min(score, 100);
    }
}
