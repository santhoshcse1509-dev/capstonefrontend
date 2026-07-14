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

import java.time.LocalDate;

/**
 * Entity representing an immutable log of changes made to an active customer policy (mid-term endorsement).
 * Keeps record of who approved it and the old/new values.
 *
 * @author Santhosh
 * @since 2.0
 */
@Entity
@Table(name = "endorsements")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Endorsement extends BaseEntity {

    @NotNull(message = "Customer policy is required")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_policy_id", nullable = false)
    private CustomerPolicy customerPolicy;

    /** E.g. "SUM_ASSURED_CHANGE", "NOMINEE_CHANGE", "RIDER_CHANGE" */
    @NotBlank(message = "Endorsement type is required")
    @Column(name = "endorsement_type", nullable = false, length = 50)
    private String endorsementType;

    @Column(name = "description", length = 255)
    private String description;

    @Column(name = "old_value", columnDefinition = "TEXT")
    private String oldValue;

    @Column(name = "new_value", columnDefinition = "TEXT")
    private String newValue;

    @NotNull(message = "Effective date is required")
    @Column(name = "effective_date", nullable = false)
    private LocalDate effectiveDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approved_by_id")
    private User approvedBy;

    /** E.g. "PENDING", "APPROVED", "REJECTED" */
    @NotBlank(message = "Status is required")
    @Builder.Default
    @Column(name = "status", nullable = false, length = 20)
    private String status = "PENDING";
}
