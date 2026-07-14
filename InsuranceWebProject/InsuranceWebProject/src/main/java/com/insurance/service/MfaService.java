package com.insurance.service;

import com.warrenstrange.googleauth.GoogleAuthenticator;
import com.warrenstrange.googleauth.GoogleAuthenticatorKey;
import com.warrenstrange.googleauth.GoogleAuthenticatorQRGenerator;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * Service for Google Authenticator TOTP (Time-based One-Time Password) operations.
 *
 * <p>Handles secret generation, QR code URI construction, and TOTP code validation
 * using the {@code com.warrenstrange:googleauth} library.</p>
 *
 * @author Santhosh
 * @since 1.0
 */
@Slf4j
@Service
public class MfaService {

    private static final String ISSUER = "InsurancePro";
    private final GoogleAuthenticator gAuth = new GoogleAuthenticator();

    /**
     * Generates a new Base32-encoded TOTP secret key for a user.
     *
     * @return the raw Base32 secret string to be stored on the user entity
     */
    public String generateSecret() {
        GoogleAuthenticatorKey key = gAuth.createCredentials();
        return key.getKey();
    }

    /**
     * Builds the {@code otpauth://totp/...} URI that a QR code generator
     * (e.g. Google Charts) can convert into a scannable QR code.
     *
     * @param email  the user's email address — shown as the account name in the app
     * @param secret the Base32-encoded TOTP secret
     * @return the otpauth URI string
     */
    public String getQrCodeUri(String email, String secret) {
        return GoogleAuthenticatorQRGenerator.getOtpAuthTotpURL(
                ISSUER,
                email,
                new GoogleAuthenticatorKey.Builder(secret).build()
        );
    }

    /**
     * Validates a 6-digit TOTP code against the stored secret.
     * The library automatically checks a ±1 time-step window for clock skew.
     *
     * @param secret   the Base32-encoded TOTP secret stored for the user
     * @param totpCode the 6-digit code from the Google Authenticator app
     * @return {@code true} if the code is valid, {@code false} otherwise
     */
    public boolean validateCode(String secret, String totpCode) {
        try {
            int code = Integer.parseInt(totpCode.trim());
            return gAuth.authorize(secret, code);
        } catch (NumberFormatException e) {
            log.warn("Invalid TOTP code format (not numeric): {}", totpCode);
            return false;
        }
    }
}
