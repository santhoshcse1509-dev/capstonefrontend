package com.insurance.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "triage_configs")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TriageConfig extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "max_payout_limit", precision = 15, scale = 2, nullable = false)
    private BigDecimal maxPayoutLimit;

    @Builder.Default
    @Column(name = "is_auto_triage_enabled", nullable = false)
    private boolean isAutoTriageEnabled = true;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_category_id", nullable = false)
    private PolicyType productCategory;

    @Builder.Default
    @Column(name = "requires_no_prior_claims", nullable = false)
    private boolean requiresNoPriorClaims = true;

    @Builder.Default
    @Column(name = "requires_valid_documents", nullable = false)
    private boolean requiresValidDocuments = true;
}
