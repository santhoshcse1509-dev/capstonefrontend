package com.insurance.dto.policy;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class EndorsementResponse {
    private UUID id;
    private UUID customerPolicyId;
    private String endorsementType;
    private String description;
    private String oldValue;
    private String newValue;
    private LocalDate effectiveDate;
    private LocalDateTime createdAt;
    private String status;
}
