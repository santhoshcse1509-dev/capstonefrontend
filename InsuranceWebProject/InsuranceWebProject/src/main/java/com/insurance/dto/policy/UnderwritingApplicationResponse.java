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
public class UnderwritingApplicationResponse {
    private UUID id;
    private String appId;
    private String applicantName;
    private String product;
    private BigDecimal sumAssured;
    private int riskScore;
    private LocalDateTime submittedAt;
    private String status; // PENDING, APPROVED, REJECTED, ESCALATED
    private Integer age;
    private String occupation;
    private String medicalHistory;
    private String rejectionReason;
    private String underwritingDetailsJson;
}
