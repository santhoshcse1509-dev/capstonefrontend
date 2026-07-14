package com.insurance.config;

import com.insurance.entity.ERole;
import com.insurance.entity.PremiumRateConfig;
import com.insurance.entity.Rider;
import com.insurance.entity.Role;
import com.insurance.entity.User;
import com.insurance.repository.PremiumRateConfigRepository;
import com.insurance.repository.RiderRepository;
import com.insurance.repository.RoleRepository;
import com.insurance.repository.UserRepository;
import com.insurance.service.MfaService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final String ADMIN_EMAIL = "admin@insurancepro.com";
    private static final String ADMIN_PASSWORD = "Admin@123";
    private static final String ADMIN_FIRST_NAME = "System";
    private static final String ADMIN_LAST_NAME = "Admin";

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final MfaService mfaService;
    private final PremiumRateConfigRepository rateConfigRepository;
    private final RiderRepository riderRepository;
    private final com.insurance.repository.PolicyTypeRepository policyTypeRepository;
    private final com.insurance.repository.TriageConfigRepository triageConfigRepository;

    public DataInitializer(UserRepository userRepository,
                           RoleRepository roleRepository,
                           PasswordEncoder passwordEncoder,
                           MfaService mfaService,
                           PremiumRateConfigRepository rateConfigRepository,
                           RiderRepository riderRepository,
                           com.insurance.repository.PolicyTypeRepository policyTypeRepository,
                           com.insurance.repository.TriageConfigRepository triageConfigRepository) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.mfaService = mfaService;
        this.rateConfigRepository = rateConfigRepository;
        this.riderRepository = riderRepository;
        this.policyTypeRepository = policyTypeRepository;
        this.triageConfigRepository = triageConfigRepository;
    }

    @Override
    public void run(String... args) {
        createRoleIfMissing(ERole.ROLE_ADMIN);
        createRoleIfMissing(ERole.ROLE_CUSTOMER);
        createRoleIfMissing(ERole.ROLE_AGENT);
        createRoleIfMissing(ERole.ROLE_CLAIMS_OFFICER);

        Role adminRole = roleRepository.findByName(ERole.ROLE_ADMIN)
                .orElseThrow(() -> new IllegalStateException("ROLE_ADMIN not found"));

        User adminUser = userRepository.findByEmail(ADMIN_EMAIL).orElse(null);
        if (adminUser == null) {
            // Generate a fixed TOTP secret for the admin so the QR code is stable across restarts
            String mfaSecret = mfaService.generateSecret();
            adminUser = User.builder()
                    .firstName(ADMIN_FIRST_NAME)
                    .lastName(ADMIN_LAST_NAME)
                    .email(ADMIN_EMAIL)
                    .password(passwordEncoder.encode(ADMIN_PASSWORD))
                    .phone("+91-9999999999")
                    .emailVerified(true)
                    .enabled(true)
                    .accountNonLocked(true)
                    .mfaEnabled(false)  // Admin must complete MFA setup on first login
                    .mfaSecret(mfaSecret)
                    .provider("local")
                    .roles(Collections.singleton(adminRole))
                    .build();
        } else {
            // Ensure password and role stay in sync with the configured values
            adminUser.setPassword(passwordEncoder.encode(ADMIN_PASSWORD));
            adminUser.setEnabled(true);
            adminUser.setAccountNonLocked(true);
            if (!adminUser.getRoles().contains(adminRole)) {
                adminUser.getRoles().add(adminRole);
            }
            // Generate an MFA secret if missing (upgrade existing admin)
            if (adminUser.getMfaSecret() == null) {
                adminUser.setMfaSecret(mfaService.generateSecret());
                adminUser.setMfaEnabled(false);
            }
        }
        userRepository.save(adminUser);

        // ── Seed premium rate configs (idempotent) ────────────────────────
        seedRateConfigs();

        // ── Seed default riders (idempotent) ─────────────────────────────
        seedRiders();

        // ── Seed default triage configs (idempotent) ─────────────────────
        seedTriageConfigs();
    }

    // ── Rate Config Seed Data ─────────────────────────────────────────────────

    private void seedRateConfigs() {
        List<Object[]> configs = List.of(
            // LIFE
            new Object[]{"LIFE", "BASE_RATE_PER_MILLE",   "4.0",  "Base rate: ₹4 per ₹1,000 sum assured"},
            new Object[]{"LIFE", "AGE_BAND_18_30",         "0.80", "Age 18-30: 20% discount"},
            new Object[]{"LIFE", "AGE_BAND_31_45",         "1.00", "Age 31-45: standard rate"},
            new Object[]{"LIFE", "AGE_BAND_46_55",         "1.40", "Age 46-55: 40% loading"},
            new Object[]{"LIFE", "AGE_BAND_56_65",         "1.90", "Age 56-65: 90% loading"},
            new Object[]{"LIFE", "SMOKER",                 "1.35", "Smoker: 35% loading"},
            new Object[]{"LIFE", "BMI_OBESE",              "1.20", "Obese BMI: 20% loading"},
            new Object[]{"LIFE", "BMI_UNDERWEIGHT",        "1.10", "Underweight BMI: 10% loading"},
            new Object[]{"LIFE", "TERM_LT_5Y",             "1.20", "Short term (<5y): 20% loading"},
            new Object[]{"LIFE", "TERM_GTE_10Y",           "0.90", "Long term (>=10y): 10% discount"},
            // HEALTH
            new Object[]{"HEALTH", "BASE_RATE_PER_MILLE", "6.0",  "Base rate: ₹6 per ₹1,000 sum assured"},
            new Object[]{"HEALTH", "AGE_BAND_18_30",       "0.75", "Age 18-30: 25% discount"},
            new Object[]{"HEALTH", "AGE_BAND_31_45",       "1.00", "Age 31-45: standard rate"},
            new Object[]{"HEALTH", "AGE_BAND_46_55",       "1.50", "Age 46-55: 50% loading"},
            new Object[]{"HEALTH", "AGE_BAND_56_65",       "2.10", "Age 56-65: 110% loading"},
            new Object[]{"HEALTH", "SMOKER",               "1.30", "Smoker: 30% loading"},
            new Object[]{"HEALTH", "BMI_OBESE",            "1.25", "Obese BMI: 25% loading"},
            new Object[]{"HEALTH", "BMI_UNDERWEIGHT",      "1.10", "Underweight BMI: 10% loading"},
            new Object[]{"HEALTH", "TERM_LT_5Y",           "1.15", "Short term (<5y): 15% loading"},
            new Object[]{"HEALTH", "TERM_GTE_10Y",         "0.92", "Long term (>=10y): 8% discount"},
            // MOTOR
            new Object[]{"MOTOR", "BASE_RATE_PER_MILLE",  "30.0", "Base rate: ₹30 per ₹1,000 vehicle value"},
            new Object[]{"MOTOR", "AGE_BAND_18_30",        "1.10", "Age 18-30: 10% loading (new driver)"},
            new Object[]{"MOTOR", "AGE_BAND_31_45",        "1.00", "Age 31-45: standard rate"},
            new Object[]{"MOTOR", "AGE_BAND_46_55",        "1.00", "Age 46-55: standard rate"},
            new Object[]{"MOTOR", "AGE_BAND_56_65",        "1.15", "Age 56-65: 15% loading"},
            new Object[]{"MOTOR", "VEHICLE_AGE_GT_5",      "1.40", "Vehicle >5 years old: 40% loading"},
            new Object[]{"MOTOR", "VEHICLE_TYPE_COMMERCIAL","1.60","Commercial vehicle: 60% loading"},
            new Object[]{"MOTOR", "TERM_LT_5Y",            "1.10", "Short term: 10% loading"},
            new Object[]{"MOTOR", "TERM_GTE_10Y",          "0.95", "Long term: 5% discount"},
            // HOME
            new Object[]{"HOME", "BASE_RATE_PER_MILLE",   "2.5",  "Base rate: ₹2.5 per ₹1,000 property value"},
            new Object[]{"HOME", "AGE_BAND_18_30",         "1.00", "Standard"},
            new Object[]{"HOME", "AGE_BAND_31_45",         "1.00", "Standard"},
            new Object[]{"HOME", "AGE_BAND_46_55",         "1.00", "Standard"},
            new Object[]{"HOME", "AGE_BAND_56_65",         "1.00", "Standard"},
            new Object[]{"HOME", "PROPERTY_HIGH_RISK_ZONE", "1.80","High-risk zone (flood/earthquake): 80% loading"},
            new Object[]{"HOME", "PROPERTY_WOOD_CONSTRUCTION","1.40","Wood construction (fire risk): 40% loading"},
            new Object[]{"HOME", "TERM_LT_5Y",             "1.10", "Short term: 10% loading"},
            new Object[]{"HOME", "TERM_GTE_10Y",           "0.93", "Long term: 7% discount"},
            
            // Surrender Factors & Grace Windows (Phase 2 Configs)
            new Object[]{"LIFE", "SURRENDER_FACTOR_YEAR_1", "0.00", "Year 1 Surrender Value Factor: 0%"},
            new Object[]{"LIFE", "SURRENDER_FACTOR_YEAR_2", "0.30", "Year 2 Surrender Value Factor: 30%"},
            new Object[]{"LIFE", "SURRENDER_FACTOR_YEAR_3", "0.50", "Year 3 Surrender Value Factor: 50%"},
            new Object[]{"LIFE", "SURRENDER_FACTOR_YEAR_4_PLUS", "0.70", "Year 4+ Surrender Value Factor: 70%"},
            new Object[]{"LIFE", "SURRENDER_CHARGE_PERCENT", "5.00", "Surrender Charge deduction percentage: 5%"},
            new Object[]{"LIFE", "GRACE_WINDOW_DAYS", "30", "Grace period window length in days: 30"},

            new Object[]{"HEALTH", "SURRENDER_FACTOR_YEAR_1", "0.00", "Year 1 Surrender Factor: 0%"},
            new Object[]{"HEALTH", "SURRENDER_FACTOR_YEAR_2", "0.30", "Year 2 Surrender Factor: 30%"},
            new Object[]{"HEALTH", "SURRENDER_FACTOR_YEAR_3", "0.50", "Year 3 Surrender Factor: 50%"},
            new Object[]{"HEALTH", "SURRENDER_FACTOR_YEAR_4_PLUS", "0.70", "Year 4+ Surrender Factor: 70%"},
            new Object[]{"HEALTH", "SURRENDER_CHARGE_PERCENT", "5.00", "Surrender Charge deduction percentage: 5%"},
            new Object[]{"HEALTH", "GRACE_WINDOW_DAYS", "30", "Grace period window length in days: 30"},

            new Object[]{"MOTOR", "SURRENDER_FACTOR_YEAR_1", "0.00", "Year 1 Surrender Factor: 0%"},
            new Object[]{"MOTOR", "SURRENDER_FACTOR_YEAR_2", "0.30", "Year 2 Surrender Factor: 30%"},
            new Object[]{"MOTOR", "SURRENDER_FACTOR_YEAR_3", "0.50", "Year 3 Surrender Factor: 50%"},
            new Object[]{"MOTOR", "SURRENDER_FACTOR_YEAR_4_PLUS", "0.70", "Year 4+ Surrender Factor: 70%"},
            new Object[]{"MOTOR", "SURRENDER_CHARGE_PERCENT", "5.00", "Surrender Charge deduction percentage: 5%"},
            new Object[]{"MOTOR", "GRACE_WINDOW_DAYS", "15", "Grace period window length in days: 15"},

            new Object[]{"HOME", "SURRENDER_FACTOR_YEAR_1", "0.00", "Year 1 Surrender Factor: 0%"},
            new Object[]{"HOME", "SURRENDER_FACTOR_YEAR_2", "0.30", "Year 2 Surrender Factor: 30%"},
            new Object[]{"HOME", "SURRENDER_FACTOR_YEAR_3", "0.50", "Year 3 Surrender Factor: 50%"},
            new Object[]{"HOME", "SURRENDER_FACTOR_YEAR_4_PLUS", "0.70", "Year 4+ Surrender Factor: 70%"},
            new Object[]{"HOME", "SURRENDER_CHARGE_PERCENT", "5.00", "Surrender Charge deduction percentage: 5%"},
            new Object[]{"HOME", "GRACE_WINDOW_DAYS", "15", "Grace period window length in days: 15"}
        );

        for (Object[] row : configs) {
            String type = (String) row[0];
            String key  = (String) row[1];
            // Skip if already seeded (prevents duplicate key on restart)
            if (rateConfigRepository.findByPolicyTypeNameAndFactorKey(type, key).isEmpty()) {
                rateConfigRepository.save(PremiumRateConfig.builder()
                        .policyTypeName(type)
                        .factorKey(key)
                        .factorValue(new BigDecimal((String) row[2]))
                        .description((String) row[3])
                        .active(true)
                        .build());
            }
        }
    }

    // ── Rider Seed Data ─────────────────────────────────────────────────────

    private void seedRiders() {
        List<Object[]> riders = List.of(
            new Object[]{"CRITICAL_ILLNESS", "Critical Illness Cover",
                "Lump-sum payout on diagnosis of covered critical illnesses (cancer, heart attack, stroke).",
                "15.00"},
            new Object[]{"ACCIDENTAL_DEATH", "Accidental Death Benefit",
                "Additional sum assured paid if death occurs due to an accident.",
                "8.00"},
            new Object[]{"WAIVER_OF_PREMIUM", "Waiver of Premium",
                "Future premiums are waived if the policyholder becomes permanently disabled.",
                "5.00"}
        );

        for (Object[] row : riders) {
            String code = (String) row[0];
            if (riderRepository.findByRiderCode(code).isEmpty()) {
                riderRepository.save(Rider.builder()
                        .riderCode(code)
                        .name((String) row[1])
                        .description((String) row[2])
                        .ratePercent(new BigDecimal((String) row[3]))
                        .active(true)
                        .build());
            }
        }
    }

    private void createRoleIfMissing(ERole roleName) {
        roleRepository.findByName(roleName).orElseGet(() -> roleRepository.save(
                Role.builder().name(roleName).build()
        ));
    }

    private void seedTriageConfigs() {
        List<Object[]> configs = List.of(
            new Object[]{"HEALTH", "10000.00"},
            new Object[]{"MOTOR", "25000.00"},
            new Object[]{"HOME", "15000.00"}
        );

        for (Object[] row : configs) {
            String typeName = (String) row[0];
            BigDecimal limit = new BigDecimal((String) row[1]);
            
            if (triageConfigRepository.findByProductCategoryNameIgnoreCase(typeName).isEmpty()) {
                policyTypeRepository.findByName(typeName).ifPresent(policyType -> {
                    triageConfigRepository.save(com.insurance.entity.TriageConfig.builder()
                            .maxPayoutLimit(limit)
                            .isAutoTriageEnabled(true)
                            .productCategory(policyType)
                            .requiresNoPriorClaims(true)
                            .requiresValidDocuments(true)
                            .build());
                });
            }
        }
    }
}
