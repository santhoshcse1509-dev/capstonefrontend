package com.insurance.dto.claim;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ClaimResponse {
    private UUID id;
    private String claimNumber;
    private UUID customerPolicyId;
    private String policyName;
    private UUID userId;
    private String userName;
    private String claimType;
    private String description;
    private BigDecimal claimAmount;
    private BigDecimal approvedAmount;
    private String status;
    private Double fraudRiskScore;
    private String fraudReasons;
    private LocalDateTime submittedAt;
    private LocalDateTime resolvedAt;
    private String reviewedByName;
    private String triageResult;
    private String triageReason;

    private String claimantRelation;
    private String claimantName;
    private boolean legalHeirVerificationRequired;
    private java.util.List<String> uploadedClaimDocuments;
}
