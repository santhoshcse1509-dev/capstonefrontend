package com.insurance.repository;

import com.insurance.entity.CustomerPolicy;
import com.insurance.entity.PolicyStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CustomerPolicyRepository extends JpaRepository<CustomerPolicy, UUID> {
    List<CustomerPolicy> findByUserId(UUID userId);
    List<CustomerPolicy> findByStatus(PolicyStatus status);
    List<CustomerPolicy> findByUserIdAndStatus(UUID userId, PolicyStatus status);
    Optional<CustomerPolicy> findByPolicyNumber(String policyNumber);
    List<CustomerPolicy> findByStatusIn(List<PolicyStatus> statuses);
}
