package com.insurance.dto.bank;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class BankDetailsRequest {
    private String accountHolderName;
    private String accountNumber;
    private String ifscCode;
    private String bankName;
    private String otpCode;
    private boolean isPrimaryForDebit;
    private boolean isPrimaryForPayout;
    private boolean requiresReauthorization;
}
