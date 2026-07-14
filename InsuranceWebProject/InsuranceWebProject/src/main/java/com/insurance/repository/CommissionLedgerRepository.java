package com.insurance.repository;

import com.insurance.entity.CommissionLedger;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CommissionLedgerRepository extends JpaRepository<CommissionLedger, UUID> {
    List<CommissionLedger> findByAgentId(UUID agentId);
    Optional<CommissionLedger> findByIdempotencyKey(String idempotencyKey);
    List<CommissionLedger> findByCustomerPolicyId(UUID customerPolicyId);
}
