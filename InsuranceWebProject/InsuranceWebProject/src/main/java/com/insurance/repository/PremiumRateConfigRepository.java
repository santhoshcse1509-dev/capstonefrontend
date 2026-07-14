package com.insurance.repository;

import com.insurance.entity.PremiumRateConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PremiumRateConfigRepository extends JpaRepository<PremiumRateConfig, UUID> {

    /** Load all active rate factors for a given policy type — used by the calculator. */
    List<PremiumRateConfig> findByPolicyTypeNameAndActiveTrue(String policyTypeName);

    /** Load all rate factors (active + inactive) for a given policy type — used by admin panel. */
    List<PremiumRateConfig> findByPolicyTypeName(String policyTypeName);

    /** Find a specific factor by type + key — used for seeding & admin upsert. */
    Optional<PremiumRateConfig> findByPolicyTypeNameAndFactorKey(String policyTypeName, String factorKey);

    List<PremiumRateConfig> findByActiveTrue();
}
