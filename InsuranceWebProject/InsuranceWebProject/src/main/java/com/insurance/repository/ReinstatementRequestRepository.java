package com.insurance.repository;

import com.insurance.entity.ReinstatementRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ReinstatementRequestRepository extends JpaRepository<ReinstatementRequest, UUID> {

    List<ReinstatementRequest> findByStatus(String status);

    List<ReinstatementRequest> findByCustomerPolicyIdOrderByCreatedAtDesc(UUID customerPolicyId);
}
