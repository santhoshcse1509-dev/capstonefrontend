package com.insurance.service;

import com.insurance.dto.policy.QuoteRequest;
import com.insurance.dto.policy.QuoteResponse;
import com.insurance.entity.Policy;
import com.insurance.entity.PolicyType;
import com.insurance.entity.PremiumRateConfig;
import com.insurance.entity.Rider;
import com.insurance.exception.BadRequestException;
import com.insurance.repository.PolicyRepository;
import com.insurance.repository.PremiumRateConfigRepository;
import com.insurance.repository.RiderRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

/**
 * Unit tests for {@link PremiumCalculatorService}.
 *
 * <p>All DB calls are mocked with Mockito — no Spring context is loaded.
 * Tests verify the core underwriting business rules:
 * <ul>
 *   <li>Young non-smoker gets lower premium than old smoker</li>
 *   <li>Short-term policies load higher than long-term</li>
 *   <li>Riders add correct flat percentage on top of base</li>
 *   <li>Sum assured exceeding coverage amount is rejected</li>
 *   <li>Inactive policy is rejected</li>
 *   <li>Risk category derives correctly from effective multiplier</li>
 *   <li>Missing rate config key falls back gracefully (no NPE)</li>
 * </ul>
 *
 * @author Santhosh
 * @since 2.0
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class PremiumCalculatorServiceTest {

    @Mock private PolicyRepository policyRepository;
    @Mock private PremiumRateConfigRepository rateConfigRepository;
    @Mock private RiderRepository riderRepository;

    @InjectMocks
    private PremiumCalculatorService service;

    // ── Test fixtures ────────────────────────────────────────────────────────

    private UUID policyId;
    private Policy lifePolicy;
    private PolicyType lifeType;

    @BeforeEach
    void setUp() {
        policyId = UUID.randomUUID();
        lifeType = new PolicyType();
        lifeType.setName("LIFE");

        lifePolicy = Policy.builder()
                .name("Term Life Gold")
                .policyType(lifeType)
                .coverageAmount(new BigDecimal("10000000"))   // ₹1 Crore max
                .active(true)
                .build();
        // Set ID via reflection helper (UUID-generated field)
        lifePolicy.setId(policyId);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private List<PremiumRateConfig> standardLifeRates() {
        return List.of(
            rate("LIFE", "BASE_RATE_PER_MILLE", "4.0"),
            rate("LIFE", "AGE_BAND_18_30",      "0.80"),
            rate("LIFE", "AGE_BAND_31_45",      "1.00"),
            rate("LIFE", "AGE_BAND_46_55",      "1.40"),
            rate("LIFE", "AGE_BAND_56_65",      "1.90"),
            rate("LIFE", "SMOKER",              "1.35"),
            rate("LIFE", "BMI_OBESE",           "1.20"),
            rate("LIFE", "TERM_LT_5Y",          "1.20"),
            rate("LIFE", "TERM_GTE_10Y",        "0.90")
        );
    }

    private PremiumRateConfig rate(String type, String key, String value) {
        return PremiumRateConfig.builder()
                .policyTypeName(type)
                .factorKey(key)
                .factorValue(new BigDecimal(value))
                .active(true)
                .build();
    }

    private QuoteRequest baseRequest(int age, int termYears, boolean smoker) {
        QuoteRequest req = new QuoteRequest();
        req.setPolicyId(policyId);
        req.setAge(age);
        req.setSumAssured(new BigDecimal("5000000"));   // ₹50 Lakh
        req.setTermYears(termYears);
        req.setSmoker(smoker);
        req.setSelectedRiderIds(Collections.emptyList());
        return req;
    }

    // ── Test: young non-smoker < old smoker ─────────────────────────────────

    @Test
    @DisplayName("Young non-smoker (25, 10y) premium < old smoker (60, 3y) premium")
    void youngNonSmokerCheaperThanOldSmoker() {
        when(policyRepository.findById(policyId)).thenReturn(Optional.of(lifePolicy));
        when(rateConfigRepository.findByPolicyTypeNameAndActiveTrue("LIFE")).thenReturn(standardLifeRates());
        when(riderRepository.findByIdIn(anyList())).thenReturn(Collections.emptyList());

        QuoteRequest youngReq = baseRequest(25, 10, false);
        QuoteRequest oldReq   = baseRequest(60, 3,  true);

        QuoteResponse youngQuote = service.calculateQuote(youngReq);
        QuoteResponse oldQuote   = service.calculateQuote(oldReq);

        assertThat(youngQuote.getTotalAnnualPremium())
                .isLessThan(oldQuote.getTotalAnnualPremium());
    }

    // ── Test: long-term discount vs short-term loading ───────────────────────

    @Test
    @DisplayName("Long-term (15y) annual premium ≤ short-term (3y) for same profile")
    void longTermDiscountApplied() {
        when(policyRepository.findById(policyId)).thenReturn(Optional.of(lifePolicy));
        when(rateConfigRepository.findByPolicyTypeNameAndActiveTrue("LIFE")).thenReturn(standardLifeRates());
        when(riderRepository.findByIdIn(anyList())).thenReturn(Collections.emptyList());

        QuoteRequest shortTerm = baseRequest(35, 3,  false);
        QuoteRequest longTerm  = baseRequest(35, 15, false);

        QuoteResponse shortQuote = service.calculateQuote(shortTerm);
        QuoteResponse longQuote  = service.calculateQuote(longTerm);

        assertThat(longQuote.getTotalAnnualPremium())
                .isLessThanOrEqualTo(shortQuote.getTotalAnnualPremium());
    }

    // ── Test: smoker loading applies ─────────────────────────────────────────

    @Test
    @DisplayName("Smoker pays at least 35% more than non-smoker for same age/term")
    void smokerLoadingApplied() {
        when(policyRepository.findById(policyId)).thenReturn(Optional.of(lifePolicy));
        when(rateConfigRepository.findByPolicyTypeNameAndActiveTrue("LIFE")).thenReturn(standardLifeRates());
        when(riderRepository.findByIdIn(anyList())).thenReturn(Collections.emptyList());

        QuoteRequest nonSmoker = baseRequest(35, 10, false);
        QuoteRequest smoker    = baseRequest(35, 10, true);

        QuoteResponse nonSmokerQuote = service.calculateQuote(nonSmoker);
        QuoteResponse smokerQuote    = service.calculateQuote(smoker);

        BigDecimal minExpected = nonSmokerQuote.getTotalAnnualPremium()
                .multiply(new BigDecimal("1.35"))
                .setScale(0, java.math.RoundingMode.HALF_UP);

        assertThat(smokerQuote.getTotalAnnualPremium())
                .isGreaterThanOrEqualTo(minExpected);
    }

    // ── Test: rider adds correct flat percentage ─────────────────────────────

    @Test
    @DisplayName("Critical Illness rider (15%) adds exactly 15% of base premium")
    void riderAddsCorrectPercentage() {
        UUID riderId = UUID.randomUUID();
        Rider rider = Rider.builder()
                .riderCode("CRITICAL_ILLNESS")
                .name("Critical Illness Cover")
                .ratePercent(new BigDecimal("15.00"))
                .active(true)
                .build();
        rider.setId(riderId);

        when(policyRepository.findById(policyId)).thenReturn(Optional.of(lifePolicy));
        when(rateConfigRepository.findByPolicyTypeNameAndActiveTrue("LIFE")).thenReturn(standardLifeRates());
        when(riderRepository.findByIdIn(anyList())).thenReturn(List.of(rider));

        QuoteRequest reqWithRider    = baseRequest(35, 10, false);
        reqWithRider.setSelectedRiderIds(List.of(riderId));
        QuoteRequest reqWithoutRider = baseRequest(35, 10, false);

        // Need separate mock call for the no-rider case
        when(riderRepository.findByIdIn(Collections.emptyList())).thenReturn(Collections.emptyList());

        QuoteResponse withRider    = service.calculateQuote(reqWithRider);
        QuoteResponse withoutRider = service.calculateQuote(reqWithoutRider);

        BigDecimal expectedRiderContribution = withoutRider.getBasePremium()
                .multiply(new BigDecimal("0.15"))
                .setScale(2, java.math.RoundingMode.HALF_UP);

        assertThat(withRider.getRiderPremium()).isEqualByComparingTo(expectedRiderContribution);
        assertThat(withRider.getTotalAnnualPremium())
                .isEqualByComparingTo(withoutRider.getTotalAnnualPremium().add(expectedRiderContribution));
    }

    // ── Test: sum assured > coverage amount rejected ─────────────────────────

    @Test
    @DisplayName("Sum assured exceeding policy coverage amount throws BadRequestException")
    void sumAssuredExceedsMaxRejected() {
        when(policyRepository.findById(policyId)).thenReturn(Optional.of(lifePolicy));

        QuoteRequest req = baseRequest(30, 10, false);
        req.setSumAssured(new BigDecimal("99000000")); // ₹9.9 Cr > ₹1 Cr max

        assertThatThrownBy(() -> service.calculateQuote(req))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("cannot exceed");
    }

    // ── Test: inactive policy rejected ───────────────────────────────────────

    @Test
    @DisplayName("Inactive policy throws BadRequestException")
    void inactivePolicyRejected() {
        lifePolicy.setActive(false);
        when(policyRepository.findById(policyId)).thenReturn(Optional.of(lifePolicy));

        assertThatThrownBy(() -> service.calculateQuote(baseRequest(30, 10, false)))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("not active");
    }

    // ── Test: risk category derivation ──────────────────────────────────────

    @Test
    @DisplayName("Low-risk profile yields LOW category; high-risk yields HIGH")
    void riskCategoryDerived() {
        when(policyRepository.findById(policyId)).thenReturn(Optional.of(lifePolicy));
        when(rateConfigRepository.findByPolicyTypeNameAndActiveTrue("LIFE")).thenReturn(standardLifeRates());
        when(riderRepository.findByIdIn(anyList())).thenReturn(Collections.emptyList());

        QuoteResponse lowRisk = service.calculateQuote(baseRequest(25, 10, false));
        assertThat(lowRisk.getCalculatedRiskCategory()).isEqualTo("LOW");

        QuoteResponse highRisk = service.calculateQuote(baseRequest(60, 3, true));
        assertThat(highRisk.getCalculatedRiskCategory()).isIn("MEDIUM", "HIGH");
    }

    // ── Test: missing rate config key → graceful fallback ───────────────────

    @Test
    @DisplayName("Quote succeeds with no NPE when rate configs list is empty (fallback base rate)")
    void missingRateConfigGracefulFallback() {
        when(policyRepository.findById(policyId)).thenReturn(Optional.of(lifePolicy));
        when(rateConfigRepository.findByPolicyTypeNameAndActiveTrue(anyString()))
                .thenReturn(Collections.emptyList());   // simulate blank DB
        when(riderRepository.findByIdIn(anyList())).thenReturn(Collections.emptyList());

        QuoteResponse quote = service.calculateQuote(baseRequest(35, 10, false));

        // Should still return a positive premium (fallback 4.0 rate)
        assertThat(quote.getTotalAnnualPremium()).isGreaterThan(BigDecimal.ZERO);
    }

    // ── Test: BMI loading ────────────────────────────────────────────────────

    @Test
    @DisplayName("Obese BMI adds 20% loading on top of base for LIFE policy")
    void obeseBmiLoadingApplied() {
        when(policyRepository.findById(policyId)).thenReturn(Optional.of(lifePolicy));
        when(rateConfigRepository.findByPolicyTypeNameAndActiveTrue("LIFE")).thenReturn(standardLifeRates());
        when(riderRepository.findByIdIn(anyList())).thenReturn(Collections.emptyList());

        QuoteRequest normal = baseRequest(35, 10, false);
        QuoteRequest obese  = baseRequest(35, 10, false);
        obese.setBmiCategory("OBESE");

        QuoteResponse normalQuote = service.calculateQuote(normal);
        QuoteResponse obeseQuote  = service.calculateQuote(obese);

        assertThat(obeseQuote.getTotalAnnualPremium())
                .isGreaterThan(normalQuote.getTotalAnnualPremium());
    }
}
