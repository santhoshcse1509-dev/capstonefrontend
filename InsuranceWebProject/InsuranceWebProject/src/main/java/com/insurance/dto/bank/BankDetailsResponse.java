package com.insurance.dto.bank;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class BankDetailsResponse {
    private UUID id;
    private String ownerType;
    private UUID ownerId;
    private String accountHolderName;
    private String accountNumberMasked;
    private String ifscCode;
    private String bankName;
    private boolean isVerified;
    private boolean isPrimaryForDebit;
    private boolean isPrimaryForPayout;
    private boolean requiresReauthorization;
}
