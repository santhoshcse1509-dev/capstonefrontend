package com.insurance.dto.policy;

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
public class ReinstatementResponse {
    private UUID id;
    private UUID customerPolicyId;
    private String policyNumber;
    private String customerName;
    private String kycStatus;
    private BigDecimal overduePremiumPaid;
    private String status;
    private LocalDateTime requestDate;
    private String rejectionReason;
}
