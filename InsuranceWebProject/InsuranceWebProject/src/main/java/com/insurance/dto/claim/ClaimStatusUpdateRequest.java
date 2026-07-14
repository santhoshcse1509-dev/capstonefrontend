package com.insurance.dto.claim;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ClaimStatusUpdateRequest {
    @NotBlank(message = "Status is required")
    private String status;
    
    private BigDecimal approvedAmount;
    private Double fraudRiskScore;
    private String fraudReasons;
    private String notes;
}
