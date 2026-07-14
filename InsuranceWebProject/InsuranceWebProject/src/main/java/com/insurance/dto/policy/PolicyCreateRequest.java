package com.insurance.dto.policy;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class PolicyCreateRequest {
    @NotBlank(message = "Policy name is required")
    private String name;
    
    private String description;
    
    @NotNull(message = "Policy type ID is required")
    private Long policyTypeId;
    
    @NotNull(message = "Coverage amount is required")
    private BigDecimal coverageAmount;
    
    @NotNull(message = "Premium amount is required")
    private BigDecimal premiumAmount;
    
    private String benefits;
    private String exclusions;
    private int waitingPeriodDays;
    private String claimProcess;
    private String documentsRequired;
    private String eligibility;
    private String riskCategory;
    private int durationMonths;
}
