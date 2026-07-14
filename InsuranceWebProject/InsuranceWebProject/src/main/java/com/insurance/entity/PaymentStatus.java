package com.insurance.entity;

/**
 * Enumeration representing the status of a payment transaction.
 *
 * @author Santhosh
 * @since 1.0
 */
public enum PaymentStatus {

    /** Payment has been initiated but not yet processed */
    PENDING,

    /** Payment was processed successfully */
    SUCCESS,

    /** Payment processing failed */
    FAILED,

    /** Payment was refunded to the customer */
    REFUNDED
}
