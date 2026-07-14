package com.insurance.dto.policy;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

/**
 * Input to {@link com.insurance.service.PremiumCalculatorService#calculateQuote}.
 *
 * <p>Type-specific risk fields (smoker, BMI, vehicleAge, etc.) are optional —
 * only those relevant to the selected policy type are used. All others are ignored.
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class QuoteRequest {

    @NotNull(message = "Policy ID is required")
    private UUID policyId;

    /**
     * Applicant's age in years. Used for age-band premium loading.
     */
    @NotNull(message = "Age is required")
    @Min(value = 18, message = "Minimum age is 18")
    @Max(value = 70, message = "Maximum age is 70")
    private Integer age;

    /**
     * The cover amount the customer wants (must be ≤ Policy.coverageAmount).
     */
    @NotNull(message = "Sum assured is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Sum assured must be positive")
    private BigDecimal sumAssured;

    /**
     * Policy term in years.
     */
    @NotNull(message = "Term is required")
    @Min(value = 1, message = "Minimum term is 1 year")
    @Max(value = 40, message = "Maximum term is 40 years")
    private Integer termYears;

    // ── LIFE / HEALTH risk factors ────────────────────────────────────────────

    /** Whether the applicant smokes — applies SMOKER loading for LIFE and HEALTH policies. */
    private boolean smoker;

    /**
     * BMI category: "NORMAL", "OBESE", "UNDERWEIGHT".
     * Applies BMI_OBESE or BMI_UNDERWEIGHT loading for LIFE/HEALTH.
     */
    private String bmiCategory;

    // ── MOTOR risk factors ───────────────────────────────────────────────────

    /** Vehicle age in years — applies VEHICLE_AGE_GT_5 loading for MOTOR policies. */
    private Integer vehicleAge;

    /** Vehicle type: "PRIVATE", "COMMERCIAL". Applies VEHICLE_TYPE_COMMERCIAL loading. */
    private String vehicleType;

    // ── HOME risk factors ────────────────────────────────────────────────────

    /** Location risk zone: "HIGH_RISK", "NORMAL". Applies PROPERTY_HIGH_RISK_ZONE loading. */
    private String propertyZone;

    /** Construction type: "WOOD", "CONCRETE". Applies PROPERTY_WOOD_CONSTRUCTION loading. */
    private String constructionType;

    // ── Rider selection ──────────────────────────────────────────────────────

    /** UUIDs of riders the customer wants to add. May be null or empty. */
    private List<UUID> selectedRiderIds;
}
