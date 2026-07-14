package com.insurance.repository;

import com.insurance.entity.Claim;
import com.insurance.entity.ClaimStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ClaimRepository extends JpaRepository<Claim, UUID> {
    Optional<Claim> findByClaimNumber(String claimNumber);
    List<Claim> findByUserId(UUID userId);
    List<Claim> findByStatus(ClaimStatus status);
    List<Claim> findByCustomerPolicyId(UUID customerPolicyId);
}
