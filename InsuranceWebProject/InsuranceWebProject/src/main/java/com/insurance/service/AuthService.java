package com.insurance.service;

import com.insurance.dto.auth.AuthResponse;
import com.insurance.dto.auth.LoginRequest;
import com.insurance.dto.auth.MfaVerifyRequest;
import com.insurance.dto.auth.RegisterRequest;
import com.insurance.dto.auth.TokenRefreshRequest;
import com.insurance.dto.user.UserResponse;
import com.insurance.entity.ERole;
import com.insurance.entity.Role;
import com.insurance.entity.User;
import com.insurance.exception.BadRequestException;
import com.insurance.exception.ResourceNotFoundException;
import com.insurance.repository.RoleRepository;
import com.insurance.repository.UserRepository;
import com.insurance.security.CustomUserDetails;
import com.insurance.security.JwtTokenProvider;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.stream.Collectors;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final AuthenticationManager authenticationManager;
    private final MfaService mfaService;
    private final EmailService emailService;

    public AuthService(UserRepository userRepository, RoleRepository roleRepository,
                       PasswordEncoder passwordEncoder, JwtTokenProvider jwtTokenProvider,
                       AuthenticationManager authenticationManager, MfaService mfaService,
                       EmailService emailService) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenProvider = jwtTokenProvider;
        this.authenticationManager = authenticationManager;
        this.mfaService = mfaService;
        this.emailService = emailService;
    }

    /**
     * Registers a new customer user.
     *
     * <p>A TOTP secret is generated and stored on the user. The response
     * contains {@code mfaRequired=true}, an {@code mfaSetupUri} (to render a
     * QR code), and a short-lived {@code tempToken}. The client must call
     * {@link #verifyMfaSetup} with the tempToken and the TOTP code to complete
     * registration and receive full JWT tokens.</p>
     */
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email address already in use!");
        }

        // Generate MFA secret upfront
        String mfaSecret = mfaService.generateSecret();

        User user = new User();
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setPhone(request.getPhone());
        user.setEmailVerified(false);
        user.setMfaEnabled(false);   // enabled=false until TOTP code is verified
        user.setMfaSecret(mfaSecret);
        user.setProvider("local");
        user.setEnabled(true);
        user.setAccountNonLocked(true);

        ERole roleEnum = ERole.ROLE_CUSTOMER;
        if ("ADMIN".equalsIgnoreCase(request.getRole())) {
            roleEnum = ERole.ROLE_ADMIN;
        } else if ("AGENT".equalsIgnoreCase(request.getRole())) {
            roleEnum = ERole.ROLE_AGENT;
        } else if ("CLAIMS_OFFICER".equalsIgnoreCase(request.getRole()) || "OFFICER".equalsIgnoreCase(request.getRole())) {
            roleEnum = ERole.ROLE_CLAIMS_OFFICER;
        }
        final ERole finalRoleEnum = roleEnum;
        Role userRole = roleRepository.findByName(finalRoleEnum)
                .orElseThrow(() -> new ResourceNotFoundException("Error: Role " + finalRoleEnum + " not found."));
        user.setRoles(Collections.singleton(userRole));

        userRepository.save(user);

        // Build the otpauth URI for QR code rendering
        String mfaSetupUri = mfaService.getQrCodeUri(request.getEmail(), mfaSecret);

        // Issue a 5-minute temp token so the client can call /verify-mfa
        String tempToken = jwtTokenProvider.generateTempToken(request.getEmail());

        return AuthResponse.builder()
                .mfaRequired(true)
                .mfaSetupUri(mfaSetupUri)
                .tempToken(tempToken)
                .build();
    }

    /**
     * Authenticates a user with email + password.
     *
     * <ul>
     *   <li>If MFA is <em>not</em> enabled (e.g. brand-new account not yet
     *       verified), a full JWT is returned immediately.</li>
     *   <li>If MFA <em>is</em> enabled, a short-lived temp token is returned
     *       with {@code mfaRequired=true} and no access/refresh tokens.
     *       The client must call {@link #verifyMfaLogin} next.</li>
     * </ul>
     */
    @Transactional
    public AuthResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );
        SecurityContextHolder.getContext().setAuthentication(authentication);

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        user.setLastLoginAt(java.time.LocalDateTime.now());
        userRepository.save(user);

        if (user.isMfaEnabled()) {
            // Credentials OK — require TOTP next
            String tempToken = jwtTokenProvider.generateTempToken(user.getEmail());
            return AuthResponse.builder()
                    .mfaRequired(true)
                    .tempToken(tempToken)
                    .build();
        }

        // If an existing user has no MFA secret at all, generate one now to force setup
        if (user.getMfaSecret() == null) {
            user.setMfaSecret(mfaService.generateSecret());
            user.setMfaEnabled(false);
            userRepository.save(user);
        }

        // MFA not yet set up — still return QR so the user sets it up now
        if (!user.isMfaEnabled()) {
            String mfaSetupUri = mfaService.getQrCodeUri(user.getEmail(), user.getMfaSecret());
            String tempToken = jwtTokenProvider.generateTempToken(user.getEmail());
            return AuthResponse.builder()
                    .mfaRequired(true)
                    .mfaSetupUri(mfaSetupUri)
                    .tempToken(tempToken)
                    .build();
        }

        // No MFA at all — issue full tokens directly
        String jwt = jwtTokenProvider.generateAccessToken(authentication);
        String refresh = jwtTokenProvider.generateRefreshToken(authentication);

        // Send login notification email
        emailService.sendLoginNotificationEmail(user.getEmail(), user.getFirstName());

        return AuthResponse.builder()
                .accessToken(jwt)
                .refreshToken(refresh)
                .user(mapToUserResponse(user))
                .build();
    }

    /**
     * Completes the MFA <em>setup</em> flow (called after registration).
     * Validates the TOTP code, marks mfaEnabled=true, and issues full JWT tokens.
     */
    @Transactional
    public AuthResponse verifyMfaSetup(MfaVerifyRequest request) {
        String email = jwtTokenProvider.getEmailFromTempToken(request.getTempToken());

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (user.getMfaSecret() == null) {
            throw new BadRequestException("No MFA secret found. Please register again.");
        }

        if (!mfaService.validateCode(user.getMfaSecret(), request.getTotpCode())) {
            throw new BadRequestException("Invalid or expired authentication code. Please try again.");
        }

        // Mark MFA as enabled permanently
        user.setMfaEnabled(true);
        userRepository.save(user);

        // Send welcome/registration successful email
        emailService.sendWelcomeEmail(user.getEmail(), user.getFirstName());

        return buildFullAuthResponse(user);
    }

    /**
     * Completes the MFA <em>login</em> step.
     * Validates the TOTP code and issues full JWT tokens.
     */
    @Transactional
    public AuthResponse verifyMfaLogin(MfaVerifyRequest request) {
        String email = jwtTokenProvider.getEmailFromTempToken(request.getTempToken());

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (!user.isMfaEnabled() || user.getMfaSecret() == null) {
            throw new BadRequestException("MFA is not configured for this account.");
        }

        if (!mfaService.validateCode(user.getMfaSecret(), request.getTotpCode())) {
            throw new BadRequestException("Invalid or expired authentication code. Please try again.");
        }

        // Send login notification email
        emailService.sendLoginNotificationEmail(user.getEmail(), user.getFirstName());

        return buildFullAuthResponse(user);
    }

    public AuthResponse refreshToken(TokenRefreshRequest request) {
        String token = request.getRefreshToken();
        if (jwtTokenProvider.validateToken(token)) {
            String email = jwtTokenProvider.getUserEmailFromToken(token);
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found"));

            CustomUserDetails userDetails = CustomUserDetails.build(user);
            Authentication authentication = new UsernamePasswordAuthenticationToken(
                    userDetails, null, userDetails.getAuthorities()
            );

            String newAccess = jwtTokenProvider.generateAccessToken(authentication);

            return AuthResponse.builder()
                    .accessToken(newAccess)
                    .refreshToken(token)
                    .user(mapToUserResponse(user))
                    .build();
        }
        throw new BadRequestException("Invalid refresh token");
    }

    // ── Helpers ────────────────────────────────────────────────────

    private AuthResponse buildFullAuthResponse(User user) {
        CustomUserDetails userDetails = CustomUserDetails.build(user);
        Authentication authentication = new UsernamePasswordAuthenticationToken(
                userDetails, null, userDetails.getAuthorities()
        );
        String jwt     = jwtTokenProvider.generateAccessToken(authentication);
        String refresh = jwtTokenProvider.generateRefreshToken(authentication);

        return AuthResponse.builder()
                .accessToken(jwt)
                .refreshToken(refresh)
                .user(mapToUserResponse(user))
                .build();
    }

    public UserResponse mapToUserResponse(User user) {
        String customerId = user.getCustomerId();
        if (customerId == null || customerId.trim().isEmpty()) {
            customerId = "CUST-" + user.getId().toString().substring(0, 8).toUpperCase();
        }
        return UserResponse.builder()
                .id(user.getId())
                .customerId(customerId)
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .address(user.getAddress())
                .city(user.getCity())
                .state(user.getState())
                .zipCode(user.getZipCode())
                .dateOfBirth(user.getDateOfBirth())
                .gender(user.getGender())
                .profileImageUrl(user.getProfileImageUrl())
                .kycStatus(user.getKycStatus() != null ? user.getKycStatus().name() : null)
                .accountStatus(user.getAccountStatus() != null ? user.getAccountStatus().name() : "ACTIVE")
                .lastLoginAt(user.getLastLoginAt())
                .licenseNumber(user.getLicenseNumber())
                .licenseExpiryDate(user.getLicenseExpiryDate())
                .lifetimeCommission(user.getLifetimeCommission())
                .customerCount(user.getCustomerCount())
                .emailVerified(user.isEmailVerified())
                .mfaEnabled(user.isMfaEnabled())
                .enabled(user.isEnabled())
                .roles(user.getRoles().stream()
                        .map(role -> role.getName().name())
                        .collect(Collectors.toList()))
                .build();
    }
}
