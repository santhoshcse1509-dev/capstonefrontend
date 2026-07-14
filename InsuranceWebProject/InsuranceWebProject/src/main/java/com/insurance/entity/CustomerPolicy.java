package com.insurance.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * Join entity representing a customer's purchased policy.
 * <p>
 * Links a {@link User} (customer) to a {@link Policy} (product) with
 * instance-specific details such as start/end dates, premium paid,
 * and lifecycle status.
 *
 * @author Santhosh
 * @since 1.0
 */
@Entity
@Table(name = "customer_policies")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CustomerPolicy extends BaseEntity {

    @NotNull(message = "User is required")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @NotNull(message = "Policy is required")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "policy_id", nullable = false)
    private Policy policy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "agent_id")
    private User agent;

    /** Unique identifier for this customer's policy instance (e.g. POL-XXXXXXXX) */
    @Column(name = "policy_number", nullable = false, unique = true, length = 20)
    private String policyNumber;

    @NotNull(message = "Start date is required")
    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @NotNull(message = "End date is required")
    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 50)
    private PolicyStatus status = PolicyStatus.PENDING_PAYMENT;

    @Column(name = "premium_due_date")
    private LocalDate premiumDueDate;

    @Builder.Default
    @Column(name = "premium_frequency", length = 20)
    private String premiumFrequency = "ANNUAL";

    @Column(name = "last_payment_date")
    private LocalDate lastPaymentDate;

    @Column(name = "premium_paid", precision = 15, scale = 2)
    private BigDecimal premiumPaid;

    @Column(name = "coverage_amount", precision = 15, scale = 2)
    private BigDecimal coverageAmount;

    /**
     * The sum the customer chose to insure (customer-selected, ≤ policy template's coverageAmount).
     * Populated at purchase time by the underwriting engine.
     */
    @Column(name = "sum_assured", precision = 15, scale = 2)
    private BigDecimal sumAssured;

    /** Policy term in years as entered by the customer during purchase. */
    @Column(name = "term_years")
    private Integer termYears;

    /**
     * The real premium computed by {@link com.insurance.service.PremiumCalculatorService}
     * at purchase time. Stored so renewals and endorsements can reference the original quote.
     */
    @Column(name = "quoted_premium", precision = 15, scale = 2)
    private BigDecimal quotedPremium;

    /** Riders the customer selected when purchasing this policy. */
    @Builder.Default
    @ManyToMany
    @JoinTable(
            name = "customer_policy_riders",
            joinColumns = @JoinColumn(name = "customer_policy_id"),
            inverseJoinColumns = @JoinColumn(name = "rider_id")
    )
    private List<Rider> selectedRiders = new ArrayList<>();

    @Column(name = "quote_expires_at")
    private java.time.LocalDateTime quoteExpiresAt;

    @Column(name = "underwriting_details", columnDefinition = "jsonb")
    @org.hibernate.annotations.JdbcTypeCode(org.hibernate.type.SqlTypes.JSON)
    private String underwritingDetails;

    @Column(name = "rejection_reason")
    private String rejectionReason;
}
