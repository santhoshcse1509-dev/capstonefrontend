package com.insurance.controller;

import com.insurance.dto.auth.AuthResponse;
import com.insurance.dto.auth.LoginRequest;
import com.insurance.dto.auth.MfaVerifyRequest;
import com.insurance.dto.auth.RegisterRequest;
import com.insurance.dto.auth.TokenRefreshRequest;
import com.insurance.dto.common.ApiResponse;
import com.insurance.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@Tag(name = "Authentication", description = "Endpoints for user registration, login, MFA setup, and token refresh")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    @Operation(summary = "Register a new customer. Returns MFA setup QR code URI and temp token.")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return ResponseEntity.ok(ApiResponse.<AuthResponse>builder()
                .success(true)
                .message("Registration initiated. Please scan the QR code and enter the verification code.")
                .data(response)
                .build());
    }

    @PostMapping("/login")
    @Operation(summary = "Login with email + password. Returns full JWT or MFA temp token if MFA is enabled.")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        String message = response.isMfaRequired()
                ? "MFA verification required."
                : "Login successful";
        return ResponseEntity.ok(ApiResponse.<AuthResponse>builder()
                .success(true)
                .message(message)
                .data(response)
                .build());
    }

    @PostMapping("/verify-mfa")
    @Operation(summary = "Verify a TOTP code. Used for both MFA setup (registration) and MFA login step.")
    public ResponseEntity<ApiResponse<AuthResponse>> verifyMfa(@Valid @RequestBody MfaVerifyRequest request) {
        // Try login verification first (mfaEnabled=true), fall back to setup verification
        AuthResponse response;
        try {
            response = authService.verifyMfaLogin(request);
        } catch (Exception e) {
            // If login verify fails (e.g. mfaEnabled=false), try setup verification
            response = authService.verifyMfaSetup(request);
        }
        return ResponseEntity.ok(ApiResponse.<AuthResponse>builder()
                .success(true)
                .message("Authentication successful")
                .data(response)
                .build());
    }

    @PostMapping("/refresh-token")
    @Operation(summary = "Refresh the expired access token using a refresh token")
    public ResponseEntity<ApiResponse<AuthResponse>> refreshToken(@Valid @RequestBody TokenRefreshRequest request) {
        AuthResponse response = authService.refreshToken(request);
        return ResponseEntity.ok(ApiResponse.<AuthResponse>builder()
                .success(true)
                .message("Tokens refreshed successfully")
                .data(response)
                .build());
    }
}
