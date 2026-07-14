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

@Data
@AllArgsConstructor
@NoArgsConstructor
public class PurchasePolicyRequest {

    @NotNull(message = "Policy ID is required")
    private UUID policyId;

    // ── Nominee ──────────────────────────────────────────────────────────────
    private String nomineeName;
    private String nomineeRelationship;
    private String nomineePhone;
    private int nomineePercentage = 100;

    // ── Personal Info ────────────────────────────────────────────────────────
    private String fullName;
    private String dob;
    private String gender;
    private java.math.BigDecimal annualIncome;
    private String residentialStatus;
    private String city;
    private String zonalOffice;

    // ── Preferences ──────────────────────────────────────────────────────────
    private String planType;
    private Integer premiumPaymentTerm;
    private String premiumPaymentFrequency;

    // ── Bind & Pay details ──────────────────────────────────────────────────
    private String paymentMethod;
    private List<String> uploadedDocuments;

    // ── Underwriting inputs (forwarded to PremiumCalculatorService) ──────────

    @NotNull(message = "Sum assured is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Sum assured must be positive")
    private BigDecimal sumAssured;

    @NotNull(message = "Term is required")
    @Min(value = 1, message = "Minimum term is 1 year")
    @Max(value = 40, message = "Maximum term is 40 years")
    private Integer termYears;

    @NotNull(message = "Age is required")
    @Min(value = 1, message = "Minimum age is 1 year")
    @Max(value = 70, message = "Maximum age is 70")
    private Integer age;

    // ── Guardian Consent details (if proposer is a minor) ────────────────────
    private String guardianName;
    private String guardianContact;
    private boolean guardianConsentSigned;

    // ── Type-specific risk factors ───────────────────────────────────────────
    private boolean smoker;
    private String bmiCategory;
    private Integer vehicleAge;
    private String vehicleType;
    private String propertyZone;
    private String constructionType;

    /** Rider UUIDs the customer selected from the quote step. */
    private List<UUID> selectedRiderIds;

    // ── Life Assured Details (different from proposer) ───────────────────────
    private boolean lifeAssuredDifferent;
    private String lifeAssuredName;
    private java.time.LocalDate lifeAssuredDob;
    private String lifeAssuredGender;
    private String lifeAssuredRelationship;

    // ── Extended Nominee Details ─────────────────────────────────────────────
    private java.time.LocalDate nomineeDob;
    private String appointeeName;
    private String appointeeRelationship;

    // ── Health Declaration ───────────────────────────────────────────────────
    private boolean hasMedicalConditions;
    private String medicalConditionsDetails;
    private boolean consumesAlcohol;
    private Double heightCm;
    private Double weightKg;
    private String familyMedicalHistory;

    // ── Bank Details ─────────────────────────────────────────────────────────
    private String bankAccountHolderName;
    private String bankAccountNumber;
    private String bankIfscCode;
    private String bankNameBranch;

    // ── Consent & Declaration ────────────────────────────────────────────────
    private boolean consentInfoTrue;
    private boolean consentSmsEmail;
    private boolean consentTerms;
    private String digitalSignature;
}
