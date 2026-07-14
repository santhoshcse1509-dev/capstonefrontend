package com.insurance.dto.payment;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RazorpayOrderResponse {
    private String keyId;
    private String orderId;
    private BigDecimal amount;
    private Integer amountInPaise;
    private String currency;
    private String policyNumber;
    private String customerEmail;
    private String customerPhone;
    private String customerName;
    private boolean isMock;
}
