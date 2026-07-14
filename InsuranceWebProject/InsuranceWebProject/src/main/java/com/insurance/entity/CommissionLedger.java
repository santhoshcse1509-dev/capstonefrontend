package com.insurance.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "commission_ledger")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CommissionLedger extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "agent_id", nullable = false)
    private User agent;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_policy_id", nullable = false)
    private CustomerPolicy customerPolicy;

    @Column(name = "calculated_amount", precision = 15, scale = 2, nullable = false)
    private BigDecimal calculatedAmount;

    @Column(name = "base_commission", precision = 15, scale = 2, nullable = false)
    private BigDecimal baseCommission;

    @Builder.Default
    @Column(name = "override_commission", precision = 15, scale = 2, nullable = false)
    private BigDecimal overrideCommission = BigDecimal.ZERO;

    @Column(name = "transaction_type", length = 30, nullable = false)
    private String transactionType; // SALE, OVERRIDE, CLAWBACK

    @Builder.Default
    @Column(name = "status", length = 30, nullable = false)
    private String status = "PENDING"; // PENDING, PAID, CLAWED_BACK

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "payout_bank_details_id")
    private BankDetails payoutBankDetails;

    @Column(name = "idempotency_key", unique = true, nullable = false, length = 100)
    private String idempotencyKey;

    @Column(name = "processed_at", nullable = false)
    private LocalDateTime processedAt;

    @PrePersist
    protected void onCreate() {
        if (processedAt == null) {
            processedAt = LocalDateTime.now();
        }
    }
}
