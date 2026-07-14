package com.insurance.dto.policy;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class CustomerPolicyResponse {
    private UUID id;
    private String policyNumber;
    private UUID userId;
    private String userName;
    private UUID policyId;
    private String policyName;
    private String policyTypeName;
    private LocalDate startDate;
    private LocalDate endDate;
    private String status;
    private BigDecimal premiumPaid;
    private BigDecimal coverageAmount;
    
    // New lifecycle fields
    private LocalDate premiumDueDate;
    private String premiumFrequency;
    private LocalDate lastPaymentDate;
    private BigDecimal sumAssured;
    private Integer termYears;
    private BigDecimal quotedPremium;
}
