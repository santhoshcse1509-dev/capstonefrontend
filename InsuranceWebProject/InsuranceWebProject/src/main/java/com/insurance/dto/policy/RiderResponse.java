package com.insurance.dto.policy;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class RiderResponse {
    private UUID id;
    private String riderCode;
    private String name;
    private String description;
    private BigDecimal ratePercent;
    private boolean active;
}
