package com.insurance.repository;

import com.insurance.entity.ClaimHistory;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ClaimHistoryRepository extends JpaRepository<ClaimHistory, UUID> {
    @EntityGraph(attributePaths = {"updatedBy"})
    List<ClaimHistory> findByClaimIdOrderByCreatedAtAsc(UUID claimId);
}
