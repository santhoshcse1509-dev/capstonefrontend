package com.insurance.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.Table;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

/**
 * An optional policy add-on (rider) that a customer may select at purchase time.
 *
 * <p>Each rider adds a fixed percentage of the computed base premium to the total.
 * Riders are linked to policy templates via {@link Policy#getAvailableRiders()} and
 * to individual customer policies via {@link CustomerPolicy#getSelectedRiders()}.
 *
 * @author Santhosh
 * @since 2.0
 */
@Entity
@Table(name = "riders")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Rider extends BaseEntity {

    /**
     * Machine-readable code, e.g. {@code CRITICAL_ILLNESS}, {@code ACCIDENTAL_DEATH}.
     * Used in the quote request/response to identify riders unambiguously.
     */
    @NotBlank(message = "Rider code is required")
    @Column(name = "rider_code", nullable = false, unique = true, length = 50)
    private String riderCode;

    @NotBlank(message = "Rider name is required")
    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    /**
     * Percentage of the computed base premium added to the total when this rider is selected.
     * Range: 0.01 – 100.00.
     */
    @NotNull(message = "Rate percent is required")
    @DecimalMin(value = "0.01", message = "Rate percent must be positive")
    @DecimalMax(value = "100.00", message = "Rate percent must not exceed 100")
    @Column(name = "rate_percent", nullable = false, precision = 5, scale = 2)
    private BigDecimal ratePercent;

    @Builder.Default
    @Column(name = "active", nullable = false)
    private boolean active = true;

    /**
     * The policy templates on which this rider is available.
     * Mapped from the owning side on {@link Policy}.
     */
    @Builder.Default
    @ManyToMany(mappedBy = "availableRiders")
    private List<Policy> policies = new ArrayList<>();
}
