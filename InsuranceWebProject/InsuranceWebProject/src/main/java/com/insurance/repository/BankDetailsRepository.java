package com.insurance.repository;

import com.insurance.entity.BankDetails;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface BankDetailsRepository extends JpaRepository<BankDetails, UUID> {
    List<BankDetails> findByOwnerId(UUID ownerId);
    Optional<BankDetails> findByOwnerIdAndIsPrimaryForPayoutTrue(UUID ownerId);
    Optional<BankDetails> findByOwnerIdAndIsPrimaryForDebitTrue(UUID ownerId);
    List<BankDetails> findByOwnerIdAndIsVerifiedTrue(UUID ownerId);
}
