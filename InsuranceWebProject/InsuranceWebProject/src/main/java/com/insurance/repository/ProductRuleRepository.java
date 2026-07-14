package com.insurance.repository;

import com.insurance.entity.ProductRule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProductRuleRepository extends JpaRepository<ProductRule, UUID> {
    Optional<ProductRule> findByPlanType(String planType);
}
