package com.insurance.repository;

import com.insurance.entity.Endorsement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface EndorsementRepository extends JpaRepository<Endorsement, UUID> {

    List<Endorsement> findByCustomerPolicyIdOrderByCreatedAtDesc(UUID customerPolicyId);
}
