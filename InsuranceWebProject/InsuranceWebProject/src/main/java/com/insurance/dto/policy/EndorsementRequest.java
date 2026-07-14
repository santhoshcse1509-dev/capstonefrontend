package com.insurance.dto.policy;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class EndorsementRequest {
    private BigDecimal sumAssured;
    private String nomineeName;
    private String nomineeRelationship;
    private String nomineePhone;
    private List<UUID> selectedRiderIds;
    private String otpCode;
}
