package com.insurance.dto.policy;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Output of {@link com.insurance.service.PremiumCalculatorService#calculateQuote}.
 *
 * <p>Returns the full premium breakdown so the customer can see exactly
 * how their final premium was derived before confirming purchase.
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class QuoteResponse {

    private UUID policyId;
    private String policyName;
    private String policyTypeName;

    // ── Premium components ────────────────────────────────────────────────────

    /** Computed base premium before rider add-ons (annual). */
    private BigDecimal basePremium;

    /** Total rupee amount added by all selected riders. */
    private BigDecimal riderPremium;

    /** basePremium + riderPremium (annual). */
    private BigDecimal totalAnnualPremium;

    /** totalAnnualPremium / 12, rounded to nearest rupee. */
    private BigDecimal totalMonthlyPremium;

    /** totalAnnualPremium / 4, rounded to nearest rupee. */
    private BigDecimal totalQuarterlyPremium;

    // ── Risk assessment ───────────────────────────────────────────────────────

    /**
     * Derived risk category based on the total multiplier applied:
     * LOW (&lt;1.2), MEDIUM (1.2–1.6), HIGH (&gt;1.6).
     */
    private String calculatedRiskCategory;

    /**
     * Effective combined multiplier — product of all applied rate factors.
     * Shown in the breakdown card for transparency.
     */
    private BigDecimal effectiveMultiplier;

    // ── Itemised breakdown ────────────────────────────────────────────────────

    /**
     * Map of factorKey → appliedValue for every factor that contributed to the premium.
     * E.g. { "AGE_BAND_46_55" → 1.40, "SMOKER" → 1.35, "TERM_GTE_10Y" → 0.90 }
     */
    private Map<String, BigDecimal> factorBreakdown;

    /** Summary of each selected rider's contribution. */
    private List<RiderLineItem> riderBreakdown;

    // ── Input echo ───────────────────────────────────────────────────────────

    private BigDecimal sumAssured;
    private Integer termYears;
    private Integer age;

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class RiderLineItem {
        private UUID riderId;
        private String riderCode;
        private String riderName;
        private BigDecimal ratePercent;
        private BigDecimal premiumContribution;
    }
}
