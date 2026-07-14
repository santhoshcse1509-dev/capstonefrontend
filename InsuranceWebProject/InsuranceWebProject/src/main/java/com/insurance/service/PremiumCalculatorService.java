package com.insurance.service;

import com.insurance.dto.policy.QuoteRequest;
import com.insurance.dto.policy.QuoteResponse;
import com.insurance.entity.Policy;
import com.insurance.entity.PremiumRateConfig;
import com.insurance.entity.Rider;
import com.insurance.exception.BadRequestException;
import com.insurance.exception.ResourceNotFoundException;
import com.insurance.repository.PolicyRepository;
import com.insurance.repository.PremiumRateConfigRepository;
import com.insurance.repository.RiderRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Core underwriting engine that computes a real, DB-driven premium quote.
 *
 * <h2>Calculation Steps</h2>
 * <ol>
 *   <li>Load all active {@link PremiumRateConfig} rows for the policy's type.</li>
 *   <li>Base premium = {@code (sumAssured × BASE_RATE_PER_MILLE) / 1000}.</li>
 *   <li>Apply age-band multiplier.</li>
 *   <li>Apply term multiplier ({@code TERM_LT_5Y}, {@code TERM_GTE_10Y}).</li>
 *   <li>Apply type-specific risk factors (SMOKER, BMI, vehicle age, property zone, etc.).</li>
 *   <li>Add rider premiums: {@code (rider.ratePercent / 100) × basePremium} per rider.</li>
 *   <li>Derive {@code calculatedRiskCategory} from the effective multiplier.</li>
 * </ol>
 *
 * <p>All rate factors are read from {@code premium_rate_configs} — no constants are
 * hardcoded here, so an Admin can change any multiplier via the admin panel.
 *
 * @author Santhosh
 * @since 2.0
 */
@Service
@Transactional(readOnly = true)
public class PremiumCalculatorService {

    private static final Logger log = LoggerFactory.getLogger(PremiumCalculatorService.class);

    // ── Factor key constants (document expected DB values) ───────────────────
    static final String BASE_RATE_PER_MILLE   = "BASE_RATE_PER_MILLE";
    static final String AGE_BAND_18_30        = "AGE_BAND_18_30";
    static final String AGE_BAND_31_45        = "AGE_BAND_31_45";
    static final String AGE_BAND_46_55        = "AGE_BAND_46_55";
    static final String AGE_BAND_56_65        = "AGE_BAND_56_65";
    static final String SMOKER                = "SMOKER";
    static final String BMI_OBESE             = "BMI_OBESE";
    static final String BMI_UNDERWEIGHT       = "BMI_UNDERWEIGHT";
    static final String TERM_LT_5Y            = "TERM_LT_5Y";
    static final String TERM_GTE_10Y          = "TERM_GTE_10Y";
    static final String VEHICLE_AGE_GT_5      = "VEHICLE_AGE_GT_5";
    static final String VEHICLE_TYPE_COMMERCIAL = "VEHICLE_TYPE_COMMERCIAL";
    static final String PROPERTY_HIGH_RISK_ZONE     = "PROPERTY_HIGH_RISK_ZONE";
    static final String PROPERTY_WOOD_CONSTRUCTION  = "PROPERTY_WOOD_CONSTRUCTION";

    private final PolicyRepository policyRepository;
    private final PremiumRateConfigRepository rateConfigRepository;
    private final RiderRepository riderRepository;

    public PremiumCalculatorService(PolicyRepository policyRepository,
                                    PremiumRateConfigRepository rateConfigRepository,
                                    RiderRepository riderRepository) {
        this.policyRepository = policyRepository;
        this.rateConfigRepository = rateConfigRepository;
        this.riderRepository = riderRepository;
    }

    /**
     * Computes a full premium quote for the given inputs.
     *
     * @param request the quote input (policy, age, sumAssured, term, risk flags, riders)
     * @return a {@link QuoteResponse} with the full premium breakdown
     */
    public QuoteResponse calculateQuote(QuoteRequest request) {
        Policy policy = policyRepository.findById(request.getPolicyId())
                .orElseThrow(() -> new ResourceNotFoundException("Policy not found: " + request.getPolicyId()));

        if (!policy.isActive()) {
            throw new BadRequestException("Policy is not active and cannot be quoted.");
        }

        if (request.getSumAssured().compareTo(policy.getCoverageAmount()) > 0) {
            throw new BadRequestException(
                    "Sum assured (" + request.getSumAssured() +
                    ") cannot exceed the policy's maximum coverage amount (" + policy.getCoverageAmount() + ").");
        }

        String policyTypeName = policy.getPolicyType().getName();

        // Load all active rate configs for this policy type into a map for O(1) lookup
        Map<String, BigDecimal> rateMap = rateConfigRepository
                .findByPolicyTypeNameAndActiveTrue(policyTypeName)
                .stream()
                .collect(Collectors.toMap(PremiumRateConfig::getFactorKey, PremiumRateConfig::getFactorValue));

        if (rateMap.isEmpty()) {
            log.warn("No active rate configs found for policy type '{}'. Using fallback base rate.", policyTypeName);
        }

        Map<String, BigDecimal> factorBreakdown = new HashMap<>();
        BigDecimal runningMultiplier = BigDecimal.ONE;

        // ── Step 1: Base premium ─────────────────────────────────────────────
        BigDecimal baseRatePerMille = rateMap.getOrDefault(BASE_RATE_PER_MILLE, new BigDecimal("4.0"));
        BigDecimal basePremium = request.getSumAssured()
                .multiply(baseRatePerMille)
                .divide(new BigDecimal("1000"), 2, RoundingMode.HALF_UP);
        factorBreakdown.put(BASE_RATE_PER_MILLE, baseRatePerMille);

        // ── Step 2: Age-band multiplier ──────────────────────────────────────
        String ageBandKey = resolveAgeBandKey(request.getAge());
        BigDecimal ageFactor = rateMap.getOrDefault(ageBandKey, BigDecimal.ONE);
        runningMultiplier = runningMultiplier.multiply(ageFactor);
        factorBreakdown.put(ageBandKey, ageFactor);

        // ── Step 3: Term multiplier ──────────────────────────────────────────
        String termKey = resolveTermKey(request.getTermYears());
        if (termKey != null) {
            BigDecimal termFactor = rateMap.getOrDefault(termKey, BigDecimal.ONE);
            runningMultiplier = runningMultiplier.multiply(termFactor);
            factorBreakdown.put(termKey, termFactor);
        }

        // ── Step 4: Type-specific risk factors ───────────────────────────────
        runningMultiplier = applyTypeSpecificFactors(
                policyTypeName, request, rateMap, factorBreakdown, runningMultiplier);

        // ── Step 5: Apply combined multiplier ────────────────────────────────
        BigDecimal adjustedBasePremium = basePremium
                .multiply(runningMultiplier)
                .setScale(2, RoundingMode.HALF_UP);

        // ── Step 6: Rider premiums ────────────────────────────────────────────
        List<QuoteResponse.RiderLineItem> riderLineItems = new ArrayList<>();
        BigDecimal riderPremiumTotal = BigDecimal.ZERO;

        if (request.getSelectedRiderIds() != null && !request.getSelectedRiderIds().isEmpty()) {
            List<Rider> riders = riderRepository.findByIdIn(request.getSelectedRiderIds());
            for (Rider rider : riders) {
                BigDecimal contribution = adjustedBasePremium
                        .multiply(rider.getRatePercent())
                        .divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);
                riderPremiumTotal = riderPremiumTotal.add(contribution);
                riderLineItems.add(QuoteResponse.RiderLineItem.builder()
                        .riderId(rider.getId())
                        .riderCode(rider.getRiderCode())
                        .riderName(rider.getName())
                        .ratePercent(rider.getRatePercent())
                        .premiumContribution(contribution)
                        .build());
            }
        }

        // ── Step 7: Totals ───────────────────────────────────────────────────
        BigDecimal totalAnnual = adjustedBasePremium.add(riderPremiumTotal);
        BigDecimal totalMonthly = totalAnnual.divide(new BigDecimal("12"), 0, RoundingMode.HALF_UP);
        BigDecimal totalQuarterly = totalAnnual.divide(new BigDecimal("4"), 0, RoundingMode.HALF_UP);

        // ── Step 8: Derive risk category ─────────────────────────────────────
        String riskCategory = deriveRiskCategory(runningMultiplier);

        log.info("Quote computed for policy={} type={} sumAssured={} age={} term={} → annual={}",
                policy.getPolicyNumber(), policyTypeName, request.getSumAssured(),
                request.getAge(), request.getTermYears(), totalAnnual);

        return QuoteResponse.builder()
                .policyId(policy.getId())
                .policyName(policy.getName())
                .policyTypeName(policyTypeName)
                .basePremium(adjustedBasePremium)
                .riderPremium(riderPremiumTotal)
                .totalAnnualPremium(totalAnnual)
                .totalMonthlyPremium(totalMonthly)
                .totalQuarterlyPremium(totalQuarterly)
                .calculatedRiskCategory(riskCategory)
                .effectiveMultiplier(runningMultiplier.setScale(4, RoundingMode.HALF_UP))
                .factorBreakdown(factorBreakdown)
                .riderBreakdown(riderLineItems)
                .sumAssured(request.getSumAssured())
                .termYears(request.getTermYears())
                .age(request.getAge())
                .build();
    }

    // ── Private helpers ──────────────────────────────────────────────────────

    private BigDecimal applyTypeSpecificFactors(String policyTypeName, QuoteRequest request,
                                                 Map<String, BigDecimal> rateMap,
                                                 Map<String, BigDecimal> breakdown,
                                                 BigDecimal multiplier) {
        switch (policyTypeName.toUpperCase()) {
            case "LIFE":
            case "HEALTH": {
                if (request.isSmoker() && rateMap.containsKey(SMOKER)) {
                    BigDecimal f = rateMap.get(SMOKER);
                    multiplier = multiplier.multiply(f);
                    breakdown.put(SMOKER, f);
                }
                if ("OBESE".equalsIgnoreCase(request.getBmiCategory()) && rateMap.containsKey(BMI_OBESE)) {
                    BigDecimal f = rateMap.get(BMI_OBESE);
                    multiplier = multiplier.multiply(f);
                    breakdown.put(BMI_OBESE, f);
                }
                if ("UNDERWEIGHT".equalsIgnoreCase(request.getBmiCategory()) && rateMap.containsKey(BMI_UNDERWEIGHT)) {
                    BigDecimal f = rateMap.get(BMI_UNDERWEIGHT);
                    multiplier = multiplier.multiply(f);
                    breakdown.put(BMI_UNDERWEIGHT, f);
                }
                break;
            }
            case "MOTOR": {
                if (request.getVehicleAge() != null && request.getVehicleAge() > 5 && rateMap.containsKey(VEHICLE_AGE_GT_5)) {
                    BigDecimal f = rateMap.get(VEHICLE_AGE_GT_5);
                    multiplier = multiplier.multiply(f);
                    breakdown.put(VEHICLE_AGE_GT_5, f);
                }
                if ("COMMERCIAL".equalsIgnoreCase(request.getVehicleType()) && rateMap.containsKey(VEHICLE_TYPE_COMMERCIAL)) {
                    BigDecimal f = rateMap.get(VEHICLE_TYPE_COMMERCIAL);
                    multiplier = multiplier.multiply(f);
                    breakdown.put(VEHICLE_TYPE_COMMERCIAL, f);
                }
                break;
            }
            case "HOME": {
                if ("HIGH_RISK".equalsIgnoreCase(request.getPropertyZone()) && rateMap.containsKey(PROPERTY_HIGH_RISK_ZONE)) {
                    BigDecimal f = rateMap.get(PROPERTY_HIGH_RISK_ZONE);
                    multiplier = multiplier.multiply(f);
                    breakdown.put(PROPERTY_HIGH_RISK_ZONE, f);
                }
                if ("WOOD".equalsIgnoreCase(request.getConstructionType()) && rateMap.containsKey(PROPERTY_WOOD_CONSTRUCTION)) {
                    BigDecimal f = rateMap.get(PROPERTY_WOOD_CONSTRUCTION);
                    multiplier = multiplier.multiply(f);
                    breakdown.put(PROPERTY_WOOD_CONSTRUCTION, f);
                }
                break;
            }
            default:
                log.warn("No type-specific risk factors defined for policy type '{}'", policyTypeName);
        }
        return multiplier;
    }

    private String resolveAgeBandKey(int age) {
        if (age <= 30) return AGE_BAND_18_30;
        if (age <= 45) return AGE_BAND_31_45;
        if (age <= 55) return AGE_BAND_46_55;
        return AGE_BAND_56_65;
    }

    private String resolveTermKey(int termYears) {
        if (termYears < 5)  return TERM_LT_5Y;
        if (termYears >= 10) return TERM_GTE_10Y;
        return null; // 5-9 years → standard rate, no factor
    }

    private String deriveRiskCategory(BigDecimal multiplier) {
        double m = multiplier.doubleValue();
        if (m < 1.2) return "LOW";
        if (m < 1.6) return "MEDIUM";
        return "HIGH";
    }
}
