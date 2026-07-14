package com.insurance.dto.admin;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class PremiumRateConfigRequest {

    @NotBlank(message = "Policy type name is required")
    private String policyTypeName;

    @NotBlank(message = "Factor key is required")
    private String factorKey;

    @NotNull(message = "Factor value is required")
    @DecimalMin(value = "0.0001", message = "Factor value must be positive")
    private BigDecimal factorValue;

    private String description;

    private boolean active = true;
}
