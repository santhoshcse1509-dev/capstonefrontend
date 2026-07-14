package com.insurance.entity;

/**
 * Enumeration representing the lifecycle statuses of an insurance claim.
 * Claims progress through these states from initial submission to final resolution.
 *
 * @author Santhosh
 * @since 1.0
 */
public enum ClaimStatus {

    /** Claim has been submitted by the customer */
    SUBMITTED,

    /** Claim is under manual review */
    UNDER_REVIEW,

    /** Claim documents have been verified */
    DOCUMENTS_VERIFIED,

    /** Claim has been verified by AI fraud-detection engine */
    AI_VERIFIED,

    /** Claim is awaiting review by a claims officer */
    OFFICER_REVIEW,

    /** Claim has been approved for payment */
    APPROVED,

    /** Claim has been rejected */
    REJECTED,

    /** Claim needs more details/documentation from user */
    QUERIED,

    /** Approved claim amount has been disbursed */
    PAID
}
