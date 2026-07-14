package com.insurance.dto.auth;

import com.insurance.dto.user.UserResponse;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AuthResponse {
    private String accessToken;
    private String refreshToken;
    private final String tokenType = "Bearer";
    private UserResponse user;

    /** True when MFA verification is still required before a full JWT is issued. */
    @Builder.Default
    private boolean mfaRequired = false;

    /**
     * The otpauth:// URI used to render a QR code for MFA setup.
     * Only populated during the registration flow.
     */
    private String mfaSetupUri;

    /**
     * Short-lived token (signed JWT carrying only the user's email) returned
     * when MFA is required. The client passes this back to /verify-mfa along
     * with the TOTP code to obtain full JWT tokens.
     */
    private String tempToken;
}
