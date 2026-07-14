package com.insurance.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

/**
 * Represents a nominee designated by a customer on a specific policy.
 * <p>
 * Multiple nominees can be attached to a single {@link CustomerPolicy},
 * with their combined {@code percentage} values expected to total 100.
 *
 * @author Santhosh
 * @since 1.0
 */
@Entity
@Table(name = "nominees")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Nominee extends BaseEntity {

    @NotNull(message = "Customer policy is required")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_policy_id", nullable = false)
    private CustomerPolicy customerPolicy;

    @NotBlank(message = "Nominee name is required")
    @Column(name = "nominee_name", nullable = false, length = 100)
    private String nomineeName;

    @NotBlank(message = "Relationship is required")
    @Column(name = "relationship", nullable = false, length = 50)
    private String relationship;

    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;

    @Column(name = "phone", length = 30)
    private String phone;

    /** Percentage share of the claim payout allocated to this nominee (1-100) */
    @Min(value = 1, message = "Percentage must be at least 1")
    @Max(value = 100, message = "Percentage must not exceed 100")
    @Column(name = "percentage", nullable = false)
    private int percentage;
}
