package com.insurance.repository;

import com.insurance.entity.UserNominee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface UserNomineeRepository extends JpaRepository<UserNominee, UUID> {
    List<UserNominee> findByUserId(UUID userId);
}
