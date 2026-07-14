package com.insurance.repository;

import com.insurance.entity.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, UUID> {
    List<AuditLog> findByUserId(UUID userId);
    List<AuditLog> findByEntityTypeAndEntityId(String entityType, String entityId);

    @Query("SELECT a FROM AuditLog a WHERE " +
           "(:from IS NULL OR a.timestamp >= :from) AND " +
           "(:to IS NULL OR a.timestamp <= :to) AND " +
           "(:entityType IS NULL OR a.entityType = :entityType) " +
           "ORDER BY a.timestamp DESC")
    List<AuditLog> findWithFilters(
            @org.springframework.data.repository.query.Param("from") LocalDateTime from,
            @org.springframework.data.repository.query.Param("to") LocalDateTime to,
            @org.springframework.data.repository.query.Param("entityType") String entityType
    );

    List<AuditLog> findByTimestampBetweenOrderByTimestampDesc(LocalDateTime from, LocalDateTime to);

    List<AuditLog> findTop100ByOrderByTimestampDesc();
}

