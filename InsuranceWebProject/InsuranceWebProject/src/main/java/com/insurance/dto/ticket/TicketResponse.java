package com.insurance.dto.ticket;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class TicketResponse {
    private UUID id;
    private String ticketId;
    private UUID customerId;
    private String customerName;
    private String channel;
    private String issueType;
    private String subject;
    private String description;
    private String status;
    private LocalDateTime slaDueDate;
    private UUID assignedToId;
    private String assignedToName;
    private String resolutionNotes;
    private LocalDateTime resolvedAt;
    private LocalDateTime createdAt;
    private UUID customerPolicyId;
    private UUID claimId;
}
