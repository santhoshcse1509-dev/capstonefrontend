package com.insurance.dto.admin;

import jakarta.validation.constraints.DecimalMax;
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
public class RiderRequest {

    @NotBlank(message = "Rider code is required")
    private String riderCode;

    @NotBlank(message = "Rider name is required")
    private String name;

    private String description;

    @NotNull(message = "Rate percent is required")
    @DecimalMin(value = "0.01", message = "Rate percent must be positive")
    @DecimalMax(value = "100.00", message = "Rate percent must not exceed 100")
    private BigDecimal ratePercent;

    private boolean active = true;
}
