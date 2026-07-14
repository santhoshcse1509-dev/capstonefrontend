package com.insurance.repository;

import com.insurance.entity.PolicyType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PolicyTypeRepository extends JpaRepository<PolicyType, Long> {
    List<PolicyType> findByActiveTrue();
    java.util.Optional<PolicyType> findByName(String name);
}
