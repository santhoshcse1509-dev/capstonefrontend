package com.insurance.dto.policy;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class PolicyResponse {
    private UUID id;
    private String policyNumber;
    private String name;
    private String description;
    private String policyTypeName;
    private BigDecimal coverageAmount;
    private BigDecimal premiumAmount;
    private String benefits;
    private String exclusions;
    private int waitingPeriodDays;
    private String claimProcess;
    private String documentsRequired;
    private String eligibility;
    private String riskCategory;
    private int durationMonths;
    private boolean active;
}
