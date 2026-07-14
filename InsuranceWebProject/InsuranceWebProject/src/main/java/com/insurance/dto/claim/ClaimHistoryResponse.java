package com.insurance.dto.claim;

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
public class ClaimHistoryResponse {
    private UUID id;
    private String status;
    private String notes;
    private String updatedBy;
    private LocalDateTime createdAt;
}
