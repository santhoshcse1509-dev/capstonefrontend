package com.insurance.service;

import com.insurance.entity.Ticket;
import com.insurance.entity.TicketStatus;
import com.insurance.repository.TicketRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class TicketEscalationScheduler {

    private static final Logger logger = LoggerFactory.getLogger(TicketEscalationScheduler.class);
    private final TicketRepository ticketRepository;
    private final NotificationService notificationService; // Assuming it exists
    private final TicketService ticketService;

    public TicketEscalationScheduler(TicketRepository ticketRepository, NotificationService notificationService, TicketService ticketService) {
        this.ticketRepository = ticketRepository;
        this.notificationService = notificationService;
        this.ticketService = ticketService;
    }

    // Run every hour
    @Scheduled(fixedRate = 3600000)
    @Transactional
    public void escalateBreachedTickets() {
        logger.info("Running ticket escalation scheduler...");
        List<Ticket> breachedTickets = ticketRepository.findByStatusNotAndSlaDueDateBefore(TicketStatus.CLOSED, LocalDateTime.now());
        
        for (Ticket ticket : breachedTickets) {
            if (ticket.getStatus() != TicketStatus.RESOLVED && ticket.getStatus() != TicketStatus.ESCALATED) {
                logger.info("Escalating ticket: {}", ticket.getTicketId());
                ticket.setStatus(TicketStatus.ESCALATED);
                ticketRepository.save(ticket);
                
                notificationService.createNotification(
                        ticket.getCustomer().getId(),
                        "Ticket Escalation Alert",
                        "Grievance Ticket " + ticket.getTicketId() + " has breached SLA and has been escalated to regional managers.",
                        com.insurance.entity.NotificationType.WARNING,
                        com.insurance.entity.NotificationCategory.ACCOUNT
                );
            }
        }
    }
}
