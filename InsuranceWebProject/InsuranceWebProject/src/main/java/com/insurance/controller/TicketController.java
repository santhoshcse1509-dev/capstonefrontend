package com.insurance.controller;

import com.insurance.dto.common.ApiResponse;
import com.insurance.dto.ticket.TicketHistoryResponse;
import com.insurance.dto.ticket.TicketRequest;
import com.insurance.dto.ticket.TicketResponse;
import com.insurance.dto.ticket.TicketStatusUpdateRequest;
import com.insurance.security.CustomUserDetails;
import com.insurance.service.TicketService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/tickets")
@Tag(name = "Tickets", description = "Endpoints for unified complaint dashboard")
public class TicketController {

    private final TicketService ticketService;

    public TicketController(TicketService ticketService) {
        this.ticketService = ticketService;
    }

    @PostMapping
    @PreAuthorize("hasRole('CUSTOMER')")
    @Operation(summary = "Create a new ticket (Customer only)")
    public ResponseEntity<ApiResponse<TicketResponse>> createTicket(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody TicketRequest request) {
        TicketResponse response = ticketService.createTicket(userDetails.getId(), request);
        return ResponseEntity.ok(ApiResponse.<TicketResponse>builder()
                .success(true)
                .message("Ticket created successfully")
                .data(response)
                .build());
    }

    @GetMapping("/my-tickets")
    @PreAuthorize("hasRole('CUSTOMER')")
    @Operation(summary = "Get tickets created by the current customer")
    public ResponseEntity<ApiResponse<List<TicketResponse>>> getMyTickets(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        List<TicketResponse> tickets = ticketService.getMyTickets(userDetails.getId());
        return ResponseEntity.ok(ApiResponse.<List<TicketResponse>>builder()
                .success(true)
                .message("Tickets retrieved successfully")
                .data(tickets)
                .build());
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'CUSTOMER_SUPPORT')")
    @Operation(summary = "Get all tickets (Admin/Support only)")
    public ResponseEntity<ApiResponse<List<TicketResponse>>> getAllTickets() {
        List<TicketResponse> tickets = ticketService.getAllTickets();
        return ResponseEntity.ok(ApiResponse.<List<TicketResponse>>builder()
                .success(true)
                .message("All tickets retrieved successfully")
                .data(tickets)
                .build());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get ticket details by ID")
    public ResponseEntity<ApiResponse<TicketResponse>> getTicketById(@PathVariable UUID id) {
        TicketResponse ticket = ticketService.getTicketById(id);
        return ResponseEntity.ok(ApiResponse.<TicketResponse>builder()
                .success(true)
                .message("Ticket details retrieved successfully")
                .data(ticket)
                .build());
    }

    @GetMapping("/{id}/history")
    @Operation(summary = "Get ticket history timeline by ID")
    public ResponseEntity<ApiResponse<List<TicketHistoryResponse>>> getTicketHistory(@PathVariable UUID id) {
        List<TicketHistoryResponse> history = ticketService.getTicketHistory(id);
        return ResponseEntity.ok(ApiResponse.<List<TicketHistoryResponse>>builder()
                .success(true)
                .message("Ticket history retrieved successfully")
                .data(history)
                .build());
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'CUSTOMER_SUPPORT')")
    @Operation(summary = "Update ticket status and resolution notes (Admin/Support only)")
    public ResponseEntity<ApiResponse<TicketResponse>> updateTicketStatus(
            @PathVariable UUID id,
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody TicketStatusUpdateRequest request) {
        TicketResponse response = ticketService.updateTicketStatus(id, userDetails.getId(), request);
        return ResponseEntity.ok(ApiResponse.<TicketResponse>builder()
                .success(true)
                .message("Ticket updated successfully")
                .data(response)
                .build());
    }
}
