package com.insurance.dto.payment;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class PaymentRequest {
    @NotNull(message = "Customer policy ID is required")
    private UUID customerPolicyId;
    
    @NotNull(message = "Amount is required")
    private BigDecimal amount;
    
    private String paymentMethod;
}
