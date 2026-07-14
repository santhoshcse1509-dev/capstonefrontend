package com.insurance.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "bank_details")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BankDetails extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "owner_type", nullable = false, length = 20)
    private String ownerType; // CUSTOMER, AGENT

    @Column(name = "owner_id", nullable = false)
    private UUID ownerId;

    @Column(name = "account_holder_name", nullable = false)
    private String accountHolderName;

    @Column(name = "account_number", nullable = false)
    private String accountNumber; // Encrypted AES-256 at rest

    @Column(name = "ifsc_code", nullable = false, length = 20)
    private String ifscCode;

    @Column(name = "bank_name", nullable = false)
    private String bankName;

    @Builder.Default
    @Column(name = "is_verified", nullable = false)
    private boolean isVerified = false;

    @Builder.Default
    @Column(name = "is_primary_for_debit", nullable = false)
    private boolean isPrimaryForDebit = false;

    @Builder.Default
    @Column(name = "is_primary_for_payout", nullable = false)
    private boolean isPrimaryForPayout = false;

    @Builder.Default
    @Column(name = "requires_reauthorization", nullable = false, columnDefinition = "boolean DEFAULT false")
    private boolean requiresReauthorization = false;
}
