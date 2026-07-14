package com.insurance.repository;

import com.insurance.entity.AgentTier;
import com.insurance.entity.CommissionRate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CommissionRateRepository extends JpaRepository<CommissionRate, UUID> {
    Optional<CommissionRate> findByProductCategoryIdAndAgentTier(Long categoryId, AgentTier tier);
    Optional<CommissionRate> findByProductCategoryNameIgnoreCaseAndAgentTier(String name, AgentTier tier);
    List<CommissionRate> findByAgentTier(AgentTier tier);
}
