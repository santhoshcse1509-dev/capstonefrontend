package com.insurance.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

/**
 * Configurable rate factor row stored in the database so Admins can update
 * premium multipliers without a redeploy.
 *
 * <p>Each row represents one named factor (e.g. {@code SMOKER}, {@code AGE_BAND_46_55})
 * for a given policy type, plus the numeric multiplier that the
 * {@link com.insurance.service.PremiumCalculatorService} applies to the base premium.
 *
 * @author Santhosh
 * @since 2.0
 */
@Entity
@Table(
        name = "premium_rate_configs",
        uniqueConstraints = @UniqueConstraint(
                name = "uq_rate_config_type_key",
                columnNames = {"policy_type_name", "factor_key"}
        )
)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PremiumRateConfig extends BaseEntity {

    /**
     * Matches {@link PolicyType#getName()} — e.g. "LIFE", "HEALTH", "MOTOR", "HOME".
     * Stored as a plain string (not FK) so the table is independent of PolicyType rows
     * and easier for admins to read.
     */
    @NotBlank(message = "Policy type name is required")
    @Column(name = "policy_type_name", nullable = false, length = 50)
    private String policyTypeName;

    /**
     * Machine-readable key identifying which risk factor this row represents.
     * Convention: {@code CATEGORY_DESCRIPTION}, e.g. {@code AGE_BAND_18_30}, {@code SMOKER}.
     */
    @NotBlank(message = "Factor key is required")
    @Column(name = "factor_key", nullable = false, length = 100)
    private String factorKey;

    /**
     * The multiplier applied to the running premium for this factor.
     * Values &gt; 1 represent loadings; values &lt; 1 represent discounts.
     * For base rates, this is the per-mille value (e.g. 4.0 means ₹4 per ₹1,000 sum assured).
     */
    @NotNull(message = "Factor value is required")
    @Column(name = "factor_value", nullable = false, precision = 10, scale = 4)
    private BigDecimal factorValue;

    /** Human-readable description shown in the Admin rate-config panel. */
    @Column(name = "description", length = 255)
    private String description;

    @Builder.Default
    @Column(name = "active", nullable = false)
    private boolean active = true;
}
