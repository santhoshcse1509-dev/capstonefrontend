package com.insurance.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "commission_rates")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CommissionRate extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_category_id", nullable = false)
    private PolicyType productCategory;

    @Enumerated(EnumType.STRING)
    @Column(name = "agent_tier", length = 30, nullable = false)
    private AgentTier agentTier;

    @Column(name = "base_rate", precision = 5, scale = 2, nullable = false)
    private BigDecimal baseRate;

    @Builder.Default
    @Column(name = "tier_bonus_rate", precision = 5, scale = 2, nullable = false)
    private BigDecimal tierBonusRate = BigDecimal.ZERO;
}
