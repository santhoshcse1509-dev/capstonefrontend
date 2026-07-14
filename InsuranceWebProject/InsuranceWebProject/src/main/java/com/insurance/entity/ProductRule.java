package com.insurance.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "product_rules")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductRule extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "plan_type", unique = true, nullable = false, length = 50)
    private String planType;

    @Column(name = "free_look_days", nullable = false)
    private int freeLookDays;

    @Column(name = "lock_in_years", nullable = false)
    private int lockInYears;

    @Column(name = "surrender_allowed_in_lockin", nullable = false)
    private boolean surrenderAllowedInLockin;

    @Column(name = "surrender_value_pct", nullable = false, precision = 5, scale = 2)
    private BigDecimal surrenderValuePct;

    @Column(name = "reinstatement_cutoff_months", nullable = false)
    private int reinstatementCutoffMonths;
}
