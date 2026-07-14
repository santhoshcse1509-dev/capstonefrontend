package com.insurance.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Entity representing an audit log entry for a customer policy's status transitions.
 * Logs what state the policy was in, what it transitioned to, who triggered the change,
 * and why.
 *
 * @author Santhosh
 * @since 2.0
 */
@Entity
@Table(name = "policy_status_history")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PolicyStatusHistory extends BaseEntity {

    @NotNull(message = "Customer policy is required")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_policy_id", nullable = false)
    private CustomerPolicy customerPolicy;

    @Enumerated(EnumType.STRING)
    @Column(name = "old_status", length = 30)
    private PolicyStatus oldStatus;

    @NotNull(message = "New status is required")
    @Enumerated(EnumType.STRING)
    @Column(name = "new_status", nullable = false, length = 30)
    private PolicyStatus newStatus;

    /** E.g. "SYSTEM", "USER", "ADMIN", "AGENT" */
    @NotNull(message = "Triggered by is required")
    @Column(name = "triggered_by", nullable = false, length = 50)
    private String triggeredBy;

    @Column(name = "reason", length = 255)
    private String reason;
}
