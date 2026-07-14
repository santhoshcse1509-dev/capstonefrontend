package com.insurance.entity;

/**
 * Enumeration representing the type/category of uploaded documents.
 * Used to classify documents for KYC verification, claims processing,
 * and AI knowledge base ingestion.
 *
 * @author Santhosh
 * @since 1.0
 */
public enum DocumentType {

    /** Know Your Customer identity documents */
    KYC,

    /** Policy-related documents */
    POLICY,

    /** Claim supporting documents */
    CLAIM,

    /** Medical records and certificates */
    MEDICAL,

    /** First Information Report (for accident/theft claims) */
    FIR,

    /** Vehicle registration and inspection documents */
    VEHICLE,

    /** Medical prescriptions */
    PRESCRIPTION,

    /** Bills and invoices */
    BILL,

    /** Documents ingested into the AI knowledge base */
    AI_KNOWLEDGE
}
