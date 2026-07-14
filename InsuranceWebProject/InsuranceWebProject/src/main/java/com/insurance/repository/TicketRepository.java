package com.insurance.repository;

import com.insurance.entity.Ticket;
import com.insurance.entity.TicketStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface TicketRepository extends JpaRepository<Ticket, UUID> {
    List<Ticket> findByCustomerId(UUID customerId);
    List<Ticket> findByStatusNotAndSlaDueDateBefore(TicketStatus status, LocalDateTime now);
}
