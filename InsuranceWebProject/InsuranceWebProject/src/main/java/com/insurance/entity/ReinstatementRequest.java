package com.insurance.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
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
 * Entity tracking reinstatement requests for lapsed policies.
 * Requires admin/agent approval and verified KYC.
 *
 * @author Santhosh
 * @since 2.0
 */
@Entity
@Table(name = "reinstatement_requests")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReinstatementRequest extends BaseEntity {

    @NotNull(message = "Customer policy is required")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_policy_id", nullable = false)
    private CustomerPolicy customerPolicy;

    @NotNull(message = "Overdue premium paid is required")
    @Column(name = "overdue_premium_paid", nullable = false, precision = 15, scale = 2)
    private BigDecimal overduePremiumPaid;

    /** E.g. "PENDING", "APPROVED", "REJECTED" */
    @NotBlank(message = "Status is required")
    @Builder.Default
    @Column(name = "status", nullable = false, length = 20)
    private String status = "PENDING";

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approved_by_id")
    private User approvedBy;

    @Column(name = "approval_date")
    private LocalDateTime approvalDate;

    @Column(name = "rejection_reason", length = 255)
    private String rejectionReason;
}
