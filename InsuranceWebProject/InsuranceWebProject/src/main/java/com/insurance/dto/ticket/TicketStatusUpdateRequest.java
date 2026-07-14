package com.insurance.dto.ticket;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class TicketStatusUpdateRequest {
    @NotBlank(message = "Status is required")
    private String status;
    
    private String notes;
    private String resolutionNotes;
    private UUID assignedToId;
}
