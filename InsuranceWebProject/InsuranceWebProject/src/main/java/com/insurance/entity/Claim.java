package com.insurance.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Represents an insurance claim filed by a customer against a purchased policy.
 * <p>
 * Claims move through a multi-stage review pipeline:
 * {@code SUBMITTED → UNDER_REVIEW → AI_VERIFIED → OFFICER_REVIEW → APPROVED/REJECTED → PAID}.
 * The AI fraud-detection engine populates {@code fraudRiskScore} and {@code fraudReasons}.
 *
 * @author Santhosh
 * @since 1.0
 */
@Entity
@Table(name = "claims")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Claim extends BaseEntity {

    @Column(name = "claim_number", nullable = false, unique = true, length = 20)
    private String claimNumber;

    @NotNull(message = "Customer policy is required")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_policy_id", nullable = false)
    private CustomerPolicy customerPolicy;

    /** The user who filed this claim (claimant) */
    @NotNull(message = "Claimant user is required")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @NotBlank(message = "Claim type is required")
    @Column(name = "claim_type", nullable = false, length = 50)
    private String claimType;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @NotNull(message = "Claim amount is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Claim amount must be positive")
    @Column(name = "claim_amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal claimAmount;

    @Column(name = "approved_amount", precision = 15, scale = 2)
    private BigDecimal approvedAmount;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private ClaimStatus status = ClaimStatus.SUBMITTED;

    /** AI-computed fraud probability score (0.0 – 1.0) */
    @Column(name = "fraud_risk_score")
    private Double fraudRiskScore;

    /** JSON or text explaining AI fraud-detection reasoning */
    @Column(name = "fraud_reasons", columnDefinition = "TEXT")
    private String fraudReasons;

    @Column(name = "submitted_at")
    private LocalDateTime submittedAt;

    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;

    /** Claims officer who reviewed/approved/rejected this claim */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewed_by")
    private User reviewedBy;

    @Column(name = "triage_result", length = 30)
    private String triageResult; // AUTO_APPROVED, ESCALATED, PENDING

    @Column(name = "triage_reason")
    private String triageReason;

    @Column(name = "claimant_relation")
    private String claimantRelation;

    @Column(name = "claimant_name")
    private String claimantName;

    @Column(name = "legal_heir_verification_required")
    private boolean legalHeirVerificationRequired;

    @Column(name = "uploaded_claim_documents")
    private String uploadedClaimDocuments;
}
