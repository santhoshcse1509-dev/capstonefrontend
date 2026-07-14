package com.insurance.dto.claim;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ClaimRequest {
    @NotNull(message = "Customer policy ID is required")
    private UUID customerPolicyId;
    
    private String claimType;
    private String description;
    
    @NotNull(message = "Claim amount is required")
    private BigDecimal claimAmount;

    private java.util.List<String> uploadedClaimDocuments;
    private String claimantRelation;
    private String claimantName;
    private boolean legalHeirVerificationRequired;
}
