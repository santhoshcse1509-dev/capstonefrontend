package com.insurance.dto.auth;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request body for the /api/auth/verify-mfa endpoint.
 * Used both during MFA setup confirmation (registration) and
 * during the MFA login step.
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class MfaVerifyRequest {

    /**
     * The short-lived temp token returned by /register or /login when
     * mfaRequired is true. Identifies the user during MFA verification.
     */
    @NotBlank(message = "Temp token is required")
    private String tempToken;

    /**
     * The 6-digit TOTP code from the Google Authenticator app.
     */
    @NotBlank(message = "TOTP code is required")
    private String totpCode;
}
