package com.insurance.service;

import com.insurance.dto.policy.*;
import com.insurance.entity.*;
import com.insurance.exception.BadRequestException;
import com.insurance.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.insurance.util.EncryptionUtil;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@Transactional
class PolicyLifecycleTest {

    @Autowired
    private PolicyService policyService;

    @Autowired
    private BankDetailsRepository bankDetailsRepository;

    @Autowired
    private PaymentService paymentService;

    @Autowired
    private PolicyLifecycleScheduler policyScheduler;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PolicyRepository policyRepository;

    @Autowired
    private PolicyTypeRepository policyTypeRepository;

    @Autowired
    private CustomerPolicyRepository customerPolicyRepository;

    @Autowired
    private ReinstatementRequestRepository reinstatementRequestRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private PremiumRateConfigRepository premiumRateConfigRepository;

    private User testUser;
    private Policy testPolicy;
    private CustomerPolicy testCustomerPolicy;

    @BeforeEach
    void setUp() {
        // Find or create test policy type
        PolicyType lifeType = policyTypeRepository.findByName("LIFE")
                .orElseGet(() -> policyTypeRepository.save(
                        PolicyType.builder().name("LIFE").description("Life Insurance").active(true).build()
                ));

        // Create test user (verified KYC)
        testUser = userRepository.save(User.builder()
                .firstName("John")
                .lastName("Doe")
                .email("john.lifecycle" + UUID.randomUUID().toString().substring(0,6) + "@test.com")
                .password("Password@123")
                .kycStatus(KycStatus.VERIFIED)
                .emailVerified(true)
                .enabled(true)
                .build());

        // Create test policy template
        testPolicy = policyRepository.save(Policy.builder()
                .policyNumber("TMP-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                .name("Term Life Guard")
                .description("Term Life description")
                .policyType(lifeType)
                .coverageAmount(new BigDecimal("10000000"))
                .premiumAmount(new BigDecimal("10000"))
                .active(true)
                .durationMonths(12)
                .build());
    }

    @Test
    @DisplayName("Surrender Value formula computes free-look full refund vs tiered surrender values")
    void surrenderValueCalculations() {
        LocalDate now = LocalDate.now();

        // 1. Day 1 (Within Free-Look Window)
        CustomerPolicy cpFreeLook = customerPolicyRepository.save(CustomerPolicy.builder()
                .policyNumber("POL-FL1")
                .user(testUser)
                .policy(testPolicy)
                .startDate(now)
                .endDate(now.plusYears(10))
                .status(PolicyStatus.ACTIVE)
                .premiumPaid(new BigDecimal("20000"))
                .coverageAmount(testPolicy.getCoverageAmount())
                .sumAssured(new BigDecimal("5000000"))
                .termYears(10)
                .quotedPremium(new BigDecimal("20000"))
                .build());

        // Add a successful payment
        paymentRepository.save(Payment.builder()
                .user(testUser)
                .customerPolicy(cpFreeLook)
                .amount(new BigDecimal("20000"))
                .status(PaymentStatus.SUCCESS)
                .paymentDate(LocalDateTime.now())
                .transactionId("TXN-FL1")
                .build());

        Map<String, Object> freeLookQuote = policyService.getSurrenderQuote(cpFreeLook.getId());
        assertThat(freeLookQuote.get("isFreeLook")).isEqualTo(true);
        assertThat((BigDecimal) freeLookQuote.get("refundAmount")).isEqualByComparingTo(new BigDecimal("20000.00"));

        // 2. Year 2 Surrender (Factor 30%, Charge 5%)
        CustomerPolicy cpYear2 = customerPolicyRepository.save(CustomerPolicy.builder()
                .policyNumber("POL-Y2")
                .user(testUser)
                .policy(testPolicy)
                .startDate(now.minusYears(1).minusDays(1)) // >1 year elapsed
                .endDate(now.plusYears(9))
                .status(PolicyStatus.ACTIVE)
                .premiumPaid(new BigDecimal("40000"))
                .coverageAmount(testPolicy.getCoverageAmount())
                .sumAssured(new BigDecimal("5000000"))
                .termYears(10)
                .quotedPremium(new BigDecimal("20000"))
                .build());

        paymentRepository.save(Payment.builder()
                .user(testUser)
                .customerPolicy(cpYear2)
                .amount(new BigDecimal("40000"))
                .status(PaymentStatus.SUCCESS)
                .paymentDate(LocalDateTime.now().minusYears(1))
                .transactionId("TXN-Y2")
                .build());

        Map<String, Object> y2Quote = policyService.getSurrenderQuote(cpYear2.getId());
        assertThat(y2Quote.get("isFreeLook")).isEqualTo(false);
        // Paid: 40000. Factor: 30% -> 12000. Charge: 5% of 12000 -> 600. Refund: 11400
        assertThat((BigDecimal) y2Quote.get("refundAmount")).isEqualByComparingTo(new BigDecimal("11400.00"));
    }

    @Test
    @DisplayName("Lapse scheduler transitions overdue active policies to GRACE_PERIOD and then LAPSED")
    void lapseSchedulerTransitions() {
        LocalDate today = LocalDate.now();

        // 1. Policy overdue by 5 days -> should enter grace period
        CustomerPolicy cpGrace = customerPolicyRepository.save(CustomerPolicy.builder()
                .policyNumber("POL-SCH1")
                .user(testUser)
                .policy(testPolicy)
                .startDate(today.minusMonths(1))
                .endDate(today.plusYears(9))
                .status(PolicyStatus.ACTIVE)
                .premiumDueDate(today.minusDays(5)) // overdue 5 days ago
                .premiumFrequency("ANNUAL")
                .coverageAmount(testPolicy.getCoverageAmount())
                .build());

        // 2. Policy overdue by 45 days -> grace period of 30 days is expired -> should lapse
        CustomerPolicy cpLapsed = customerPolicyRepository.save(CustomerPolicy.builder()
                .policyNumber("POL-SCH2")
                .user(testUser)
                .policy(testPolicy)
                .startDate(today.minusMonths(2))
                .endDate(today.plusYears(9))
                .status(PolicyStatus.GRACE_PERIOD)
                .premiumDueDate(today.minusDays(45)) // overdue 45 days ago
                .premiumFrequency("ANNUAL")
                .coverageAmount(testPolicy.getCoverageAmount())
                .build());

        policyScheduler.processPolicyLifecycles();

        // Re-read from DB
        CustomerPolicy updatedGrace = customerPolicyRepository.findById(cpGrace.getId()).orElseThrow();
        CustomerPolicy updatedLapsed = customerPolicyRepository.findById(cpLapsed.getId()).orElseThrow();

        assertThat(updatedGrace.getStatus()).isEqualTo(PolicyStatus.GRACE_PERIOD);
        assertThat(updatedLapsed.getStatus()).isEqualTo(PolicyStatus.LAPSED);
    }

    @Test
    @DisplayName("Reinstatement workflow: Lapse -> Request -> Approve -> Active")
    void fullReinstatementWorkflow() {
        LocalDate now = LocalDate.now();

        // 1. Create a LAPSED policy
        CustomerPolicy cpLapsed = customerPolicyRepository.save(CustomerPolicy.builder()
                .policyNumber("POL-REI")
                .user(testUser)
                .policy(testPolicy)
                .startDate(now.minusMonths(2))
                .endDate(now.plusYears(9))
                .status(PolicyStatus.LAPSED)
                .premiumDueDate(now.minusDays(45))
                .premiumPaid(BigDecimal.ZERO)
                .coverageAmount(testPolicy.getCoverageAmount())
                .build());

        // 2. Request Reinstatement
        BigDecimal overduePremium = new BigDecimal("20000");
        ReinstatementResponse reqRes = policyService.requestReinstatement(cpLapsed.getId(), overduePremium);
        assertThat(reqRes.getStatus()).isEqualTo("PENDING");

        CustomerPolicy cpReinstated = customerPolicyRepository.findById(cpLapsed.getId()).orElseThrow();
        assertThat(cpReinstated.getStatus()).isEqualTo(PolicyStatus.REINSTATED);

        // Find pending reinstatement request
        List<ReinstatementResponse> pending = policyService.getPendingReinstatements();
        assertThat(pending).hasSize(1);
        UUID reqId = pending.get(0).getId();

        // 3. Admin Approves Reinstatement
        User admin = userRepository.save(User.builder()
                .firstName("System")
                .lastName("Admin")
                .email("admin.lifecycle" + UUID.randomUUID().toString().substring(0,6) + "@test.com")
                .password("Admin@123")
                .kycStatus(KycStatus.VERIFIED)
                .emailVerified(true)
                .enabled(true)
                .build());

        ReinstatementResponse approved = policyService.approveReinstatement(reqId, admin.getId());
        assertThat(approved.getStatus()).isEqualTo("APPROVED");

        // Verify policy is ACTIVE again
        CustomerPolicy finalCp = customerPolicyRepository.findById(cpLapsed.getId()).orElseThrow();
        assertThat(finalCp.getStatus()).isEqualTo(PolicyStatus.ACTIVE);
        assertThat(finalCp.getPremiumPaid()).isEqualByComparingTo(overduePremium);
        assertThat(finalCp.getPremiumDueDate()).isAfter(now);
    }

    private void seedRates() {
        premiumRateConfigRepository.save(PremiumRateConfig.builder().policyTypeName("LIFE").factorKey("BASE_RATE_PER_MILLE").factorValue(new BigDecimal("4.0")).active(true).build());
        premiumRateConfigRepository.save(PremiumRateConfig.builder().policyTypeName("LIFE").factorKey("AGE_BAND_18_30").factorValue(new BigDecimal("0.80")).active(true).build());
        premiumRateConfigRepository.save(PremiumRateConfig.builder().policyTypeName("LIFE").factorKey("AGE_BAND_31_45").factorValue(new BigDecimal("1.00")).active(true).build());
        premiumRateConfigRepository.save(PremiumRateConfig.builder().policyTypeName("LIFE").factorKey("AGE_BAND_46_55").factorValue(new BigDecimal("1.40")).active(true).build());
        premiumRateConfigRepository.save(PremiumRateConfig.builder().policyTypeName("LIFE").factorKey("AGE_BAND_56_65").factorValue(new BigDecimal("1.90")).active(true).build());
    }

    @Test
    @DisplayName("Verify Policy purchase details checklist can be completed successfully")
    void testPurchasePolicy() {
        seedRates();
        PurchasePolicyRequest req = new PurchasePolicyRequest();
        req.setPolicyId(testPolicy.getId());
        req.setSumAssured(new BigDecimal("1000000"));
        req.setTermYears(10);
        req.setAge(30);
        req.setSmoker(false);
        req.setBmiCategory("NORMAL");
        
        req.setFullName("John Doe");
        req.setDob("1996-07-13");
        req.setGender("MALE");
        req.setAnnualIncome(new BigDecimal("500000"));
        req.setResidentialStatus("Resident Indian");
        req.setCity("Mumbai");
        req.setZonalOffice("West Zone");
        req.setPlanType("Term");
        req.setPremiumPaymentTerm(10);
        req.setPremiumPaymentFrequency("Yearly");
        req.setPaymentMethod("UPI");
        req.setUploadedDocuments(List.of("age_proof.pdf", "id_proof.png"));

        req.setNomineeName("Jane Doe");
        req.setNomineeRelationship("Spouse");
        req.setNomineePhone("9876543211");
        req.setNomineePercentage(100);
        req.setNomineeDob(LocalDate.of(1995, 8, 20));

        req.setConsentInfoTrue(true);
        req.setConsentTerms(true);
        req.setDigitalSignature("John Doe");

        CustomerPolicyResponse resp = policyService.purchasePolicy(testUser.getId(), req);
        assertThat(resp).isNotNull();
        assertThat(resp.getPolicyNumber()).startsWith("POL-");
    }

    @Test
    @DisplayName("Verify purchase fails if nominee is a minor and appointee is missing")
    void testPurchasePolicy_MinorNomineeWithoutAppointee_ThrowsBadRequest() {
        seedRates();
        PurchasePolicyRequest req = new PurchasePolicyRequest();
        req.setPolicyId(testPolicy.getId());
        req.setSumAssured(new BigDecimal("1000000"));
        req.setTermYears(10);
        req.setAge(30);
        req.setNomineeName("Baby Doe");
        req.setNomineeRelationship("Son");
        req.setNomineePhone("9876543211");
        req.setNomineeDob(LocalDate.now().minusYears(5)); // 5 years old -> minor
        req.setConsentInfoTrue(true);
        req.setConsentTerms(true);

        assertThatThrownBy(() -> policyService.purchasePolicy(testUser.getId(), req))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("An appointee is required because the nominee is a minor (under 18).");
    }

    @Test
    @DisplayName("Verify purchase fails if mandatory consents are missing")
    void testPurchasePolicy_MissingConsent_ThrowsBadRequest() {
        seedRates();
        PurchasePolicyRequest req = new PurchasePolicyRequest();
        req.setPolicyId(testPolicy.getId());
        req.setSumAssured(new BigDecimal("1000000"));
        req.setTermYears(10);
        req.setAge(30);
        req.setConsentInfoTrue(false); // false!
        req.setConsentTerms(true);

        assertThatThrownBy(() -> policyService.purchasePolicy(testUser.getId(), req))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("You must declare that the provided information is true and accept the terms & conditions.");
    }

    @Test
    @DisplayName("Verify lifeAssured defaults to proposer details when lifeAssuredDifferent is false")
    void testPurchasePolicy_LifeAssuredDefaultSelf() throws Exception {
        seedRates();
        // Set date of birth and gender on proposer to test default mapping
        testUser.setDateOfBirth(LocalDate.of(1990, 5, 15));
        testUser.setGender("FEMALE");
        userRepository.save(testUser);

        PurchasePolicyRequest req = new PurchasePolicyRequest();
        req.setPolicyId(testPolicy.getId());
        req.setSumAssured(new BigDecimal("1000000"));
        req.setTermYears(10);
        req.setAge(30);
        req.setLifeAssuredDifferent(false); // SELF
        req.setConsentInfoTrue(true);
        req.setConsentTerms(true);
        req.setNomineeName("Jane Doe");
        req.setNomineeRelationship("Spouse");
        req.setNomineeDob(LocalDate.of(1995, 8, 20));

        CustomerPolicyResponse resp = policyService.purchasePolicy(testUser.getId(), req);
        CustomerPolicy customerPolicy = customerPolicyRepository.findByPolicyNumber(resp.getPolicyNumber()).orElseThrow();

        ObjectMapper mapper = new ObjectMapper();
        Map<String, Object> details = mapper.readValue(customerPolicy.getUnderwritingDetails(), Map.class);

        assertThat(details.get("lifeAssuredDifferent")).isEqualTo(false);
        assertThat(details.get("lifeAssuredName")).isEqualTo("John Doe");
        assertThat(details.get("lifeAssuredDob")).isEqualTo("1990-05-15");
        assertThat(details.get("lifeAssuredGender")).isEqualTo("FEMALE");
        assertThat(details.get("lifeAssuredRelationship")).isEqualTo("SELF");
    }

    @Test
    @DisplayName("Verify bank details are masked in JSONB and health fields are stored encrypted")
    void testPurchasePolicy_DataMaskingAndEncryption() throws Exception {
        seedRates();
        PurchasePolicyRequest req = new PurchasePolicyRequest();
        req.setPolicyId(testPolicy.getId());
        req.setSumAssured(new BigDecimal("1000000"));
        req.setTermYears(10);
        req.setAge(30);
        req.setConsentInfoTrue(true);
        req.setConsentTerms(true);
        req.setNomineeName("Jane Doe");
        req.setNomineeRelationship("Spouse");
        req.setNomineeDob(LocalDate.of(1995, 8, 20));

        // Bank details input
        req.setBankAccountHolderName("John Proposer");
        req.setBankAccountNumber("123456789012");
        req.setBankIfscCode("SBIN0001234");
        req.setBankNameBranch("SBI Main Branch");

        // Health declaration inputs
        req.setHasMedicalConditions(true);
        req.setMedicalConditionsDetails("Hypertension diagnosed in 2024");
        req.setFamilyMedicalHistory("Father had diabetes");

        CustomerPolicyResponse resp = policyService.purchasePolicy(testUser.getId(), req);
        CustomerPolicy customerPolicy = customerPolicyRepository.findByPolicyNumber(resp.getPolicyNumber()).orElseThrow();

        // 1. Verify JSONB contains masked bank account and encrypted health info
        ObjectMapper mapper = new ObjectMapper();
        Map<String, Object> details = mapper.readValue(customerPolicy.getUnderwritingDetails(), Map.class);

        assertThat(details.get("bankAccountNumber")).isNull(); // raw account should not exist in JSONB
        assertThat(details.get("bankAccountNumberMasked")).isEqualTo("********9012");
        assertThat(details.get("bankIfscCode")).isEqualTo("SBIN0001234");

        // Health fields should be stored encrypted (i.e. not plain text, but decryptable to original values)
        String encryptedMedical = (String) details.get("medicalConditionsDetails");
        String encryptedFamily = (String) details.get("familyMedicalHistory");

        assertThat(encryptedMedical).isNotEqualTo("Hypertension diagnosed in 2024");
        assertThat(encryptedFamily).isNotEqualTo("Father had diabetes");

        assertThat(EncryptionUtil.decrypt(encryptedMedical)).isEqualTo("Hypertension diagnosed in 2024");
        assertThat(EncryptionUtil.decrypt(encryptedFamily)).isEqualTo("Father had diabetes");

        // 2. Verify raw bank details are saved in the separate bank_details table encrypted
        List<BankDetails> bankList = bankDetailsRepository.findAll();
        BankDetails savedBank = bankList.stream()
                .filter(b -> b.getOwnerId().equals(testUser.getId()))
                .findFirst()
                .orElseThrow(() -> new AssertionError("BankDetails record was not saved in table."));

        assertThat(savedBank.getAccountNumber()).isNotEqualTo("123456789012");
        assertThat(EncryptionUtil.decrypt(savedBank.getAccountNumber())).isEqualTo("123456789012");
    }
}

