package com.insurance.service;

import com.insurance.dto.ticket.TicketHistoryResponse;
import com.insurance.dto.ticket.TicketRequest;
import com.insurance.dto.ticket.TicketResponse;
import com.insurance.dto.ticket.TicketStatusUpdateRequest;
import com.insurance.entity.*;
import com.insurance.exception.BadRequestException;
import com.insurance.exception.ResourceNotFoundException;
import com.insurance.repository.TicketHistoryRepository;
import com.insurance.repository.TicketRepository;
import com.insurance.repository.UserRepository;
import com.insurance.util.TicketNumberGenerator;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class TicketService {

    private final TicketRepository ticketRepository;
    private final TicketHistoryRepository ticketHistoryRepository;
    private final UserRepository userRepository;
    private final com.insurance.repository.CustomerPolicyRepository customerPolicyRepository;
    private final com.insurance.repository.ClaimRepository claimRepository;

    public TicketService(TicketRepository ticketRepository, TicketHistoryRepository ticketHistoryRepository,
                         UserRepository userRepository,
                         com.insurance.repository.CustomerPolicyRepository customerPolicyRepository,
                         com.insurance.repository.ClaimRepository claimRepository) {
        this.ticketRepository = ticketRepository;
        this.ticketHistoryRepository = ticketHistoryRepository;
        this.userRepository = userRepository;
        this.customerPolicyRepository = customerPolicyRepository;
        this.claimRepository = claimRepository;
    }

    @Transactional
    public TicketResponse createTicket(UUID customerId, TicketRequest request) {
        User customer = userRepository.findById(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found"));

        CustomerPolicy customerPolicy = null;
        if (request.getCustomerPolicyId() != null) {
            customerPolicy = customerPolicyRepository.findById(request.getCustomerPolicyId()).orElse(null);
        }

        Claim claim = null;
        if (request.getClaimId() != null) {
            claim = claimRepository.findById(request.getClaimId()).orElse(null);
        }

        Ticket ticket = Ticket.builder()
                .ticketId(TicketNumberGenerator.generate())
                .customer(customer)
                .channel(TicketChannel.valueOf(request.getChannel().toUpperCase()))
                .issueType(TicketIssueType.valueOf(request.getIssueType().toUpperCase()))
                .subject(request.getSubject())
                .description(request.getDescription())
                .status(TicketStatus.OPEN)
                .slaDueDate(LocalDateTime.now().plusHours(48)) // Default 48 hours SLA
                .customerPolicy(customerPolicy)
                .claim(claim)
                .build();

        Ticket saved = ticketRepository.save(ticket);
        saveTicketHistory(saved, customer, "Ticket created via " + request.getChannel());
        return mapToTicketResponse(saved);
    }

    public List<TicketResponse> getMyTickets(UUID customerId) {
        return ticketRepository.findByCustomerId(customerId).stream()
                .map(this::mapToTicketResponse)
                .collect(Collectors.toList());
    }

    public List<TicketResponse> getAllTickets() {
        return ticketRepository.findAll().stream()
                .map(this::mapToTicketResponse)
                .collect(Collectors.toList());
    }

    public TicketResponse getTicketById(UUID id) {
        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found"));
        return mapToTicketResponse(ticket);
    }

    @Transactional
    public TicketResponse updateTicketStatus(UUID ticketId, UUID userId, TicketStatusUpdateRequest request) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found"));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        TicketStatus newStatus = TicketStatus.valueOf(request.getStatus().toUpperCase());

        if (newStatus == TicketStatus.RESOLVED || newStatus == TicketStatus.CLOSED) {
            if (request.getResolutionNotes() == null || request.getResolutionNotes().trim().isEmpty()) {
                throw new BadRequestException("Resolution notes are required before closing/resolving a ticket.");
            }
            ticket.setResolutionNotes(request.getResolutionNotes());
            ticket.setResolvedAt(LocalDateTime.now());
        }

        if (request.getAssignedToId() != null) {
            User assignee = userRepository.findById(request.getAssignedToId())
                    .orElseThrow(() -> new ResourceNotFoundException("Assignee not found"));
            ticket.setAssignedTo(assignee);
        }

        ticket.setStatus(newStatus);
        Ticket saved = ticketRepository.save(ticket);

        saveTicketHistory(saved, user, request.getNotes() != null ? request.getNotes() : "Status updated to " + newStatus);

        return mapToTicketResponse(saved);
    }

    public List<TicketHistoryResponse> getTicketHistory(UUID ticketId) {
        return ticketHistoryRepository.findByTicketIdOrderByCreatedAtAsc(ticketId)
                .stream()
                .map(h -> TicketHistoryResponse.builder()
                        .id(h.getId())
                        .status(h.getStatus().name())
                        .notes(h.getNotes())
                        .updatedBy(h.getUpdatedBy() != null ? h.getUpdatedBy().getFirstName() + " " + h.getUpdatedBy().getLastName() : "System")
                        .createdAt(h.getCreatedAt())
                        .build())
                .collect(Collectors.toList());
    }

    private void saveTicketHistory(Ticket ticket, User user, String notes) {
        TicketHistory history = TicketHistory.builder()
                .ticket(ticket)
                .status(ticket.getStatus())
                .notes(notes)
                .updatedBy(user)
                .build();
        ticketHistoryRepository.save(history);
    }

    private TicketResponse mapToTicketResponse(Ticket t) {
        return TicketResponse.builder()
                .id(t.getId())
                .ticketId(t.getTicketId())
                .customerId(t.getCustomer().getId())
                .customerName(t.getCustomer().getFirstName() + " " + t.getCustomer().getLastName())
                .channel(t.getChannel().name())
                .issueType(t.getIssueType().name())
                .subject(t.getSubject())
                .description(t.getDescription())
                .status(t.getStatus().name())
                .slaDueDate(t.getSlaDueDate())
                .assignedToId(t.getAssignedTo() != null ? t.getAssignedTo().getId() : null)
                .assignedToName(t.getAssignedTo() != null ? t.getAssignedTo().getFirstName() + " " + t.getAssignedTo().getLastName() : "Unassigned")
                .resolutionNotes(t.getResolutionNotes())
                .resolvedAt(t.getResolvedAt())
                .createdAt(t.getCreatedAt())
                .customerPolicyId(t.getCustomerPolicy() != null ? t.getCustomerPolicy().getId() : null)
                .claimId(t.getClaim() != null ? t.getClaim().getId() : null)
                .build();
    }
}
