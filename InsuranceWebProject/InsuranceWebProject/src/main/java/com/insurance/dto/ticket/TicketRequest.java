package com.insurance.dto.ticket;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class TicketRequest {
    @NotBlank(message = "Channel is required")
    private String channel;
    
    @NotBlank(message = "Issue type is required")
    private String issueType;
    
    @NotBlank(message = "Subject is required")
    private String subject;
    
    @NotBlank(message = "Description is required")
    private String description;

    private java.util.UUID customerPolicyId;
    private java.util.UUID claimId;
}
