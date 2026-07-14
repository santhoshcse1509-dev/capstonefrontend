package com.insurance.repository;

import com.insurance.entity.Payment;
import com.insurance.entity.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, UUID> {
    List<Payment> findByUserId(UUID userId);
    List<Payment> findByCustomerPolicyId(UUID customerPolicyId);
    List<Payment> findByStatus(PaymentStatus status);

    @org.springframework.data.jpa.repository.Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p WHERE p.status = :status")
    java.math.BigDecimal sumAmountByStatus(PaymentStatus status);
}
