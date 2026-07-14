package com.insurance.repository;

import com.insurance.entity.TriageConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface TriageConfigRepository extends JpaRepository<TriageConfig, UUID> {
    Optional<TriageConfig> findByProductCategoryNameIgnoreCase(String name);
    Optional<TriageConfig> findByProductCategoryId(Long categoryId);
}
