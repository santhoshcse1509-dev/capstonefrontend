package com.insurance.entity;

/**
 * Enumeration representing the status of a customer's purchased policy.
 *
 * @author Santhosh
 * @since 1.0
 */
public enum PolicyStatus {

    /** Policy is in draft state */
    DRAFT,

    /** Premium is calculated and quoted, waiting for customer decision */
    QUOTED,

    /** Policy application has been submitted and is pending underwriting review */
    PENDING_UNDERWRITING,

    /** Policy application was rejected by underwriting */
    REJECTED,

    /** Policy application was escalated to senior underwriter */
    ESCALATED,

    /** Policy purchase is pending first payment */
    PENDING_PAYMENT,

    /** Policy is currently active and in force */
    ACTIVE,

    /** Policy is in grace period (overdue but not yet lapsed) */
    GRACE_PERIOD,

    /** Policy has lapsed due to non-payment */
    LAPSED,

    /** Policy has been submitted for reinstatement */
    REINSTATED,

    /** Policy was surrendered (cancelled after free-look or during free-look) */
    SURRENDERED,

    /** Policy has passed its end date */
    EXPIRED,

    /** Backward-compatible legacy values */
    PENDING,
    CANCELLED
}
