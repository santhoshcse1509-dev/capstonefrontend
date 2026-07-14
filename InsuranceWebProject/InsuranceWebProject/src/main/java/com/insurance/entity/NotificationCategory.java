package com.insurance.entity;

/**
 * Enumeration representing the business category of a notification.
 * Used to filter and prioritize notifications on the client side.
 *
 * @author Santhosh
 * @since 1.0
 */
public enum NotificationCategory {

    /** Policy renewal reminders */
    RENEWAL,

    /** Claim status change updates */
    CLAIM_UPDATE,

    /** Payment confirmations and reminders */
    PAYMENT,

    /** Policy expiry warnings */
    POLICY_EXPIRY,

    /** AI-generated personalized recommendations */
    AI_RECOMMENDATION,

    /** Account-level events: KYC, status changes, role changes */
    ACCOUNT
}

