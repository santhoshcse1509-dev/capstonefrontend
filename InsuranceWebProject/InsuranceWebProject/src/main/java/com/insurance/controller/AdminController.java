package com.insurance.controller;

import com.insurance.dto.admin.*;
import com.insurance.dto.common.ApiResponse;
import com.insurance.dto.policy.RiderResponse;
import com.insurance.dto.user.UserResponse;
import com.insurance.entity.*;
import com.insurance.exception.BadRequestException;
import com.insurance.exception.ResourceNotFoundException;
import com.insurance.repository.*;
import com.insurance.service.AdminUserService;
import com.insurance.service.AuthService;
import com.insurance.service.KycService;
import com.insurance.service.PremiumRateConfigService;
import com.insurance.service.RiderService;
import com.insurance.service.PolicyService;
import com.insurance.security.CustomUserDetails;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Admin-only endpoints for user management, KYC verification, and system oversight.
 *
 * @author Santhosh
 * @since 1.0
 */
@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Admin", description = "Admin-only endpoints for user and system management")
public class AdminController {

    private final UserRepository             userRepository;
    private final AuthService                authService;
    private final AdminUserService           adminUserService;
    private final KycService                 kycService;
    private final AuditLogRepository         auditLogRepository;
    private final ClaimRepository           claimRepository;
    private final CustomerPolicyRepository   customerPolicyRepository;
    private final PaymentRepository          paymentRepository;
    private final PremiumRateConfigService   rateConfigService;
    private final RiderService               riderService;
    private final PolicyService              policyService;

    public AdminController(UserRepository userRepository,
                           AuthService authService,
                           AdminUserService adminUserService,
                           KycService kycService,
                           AuditLogRepository auditLogRepository,
                           ClaimRepository claimRepository,
                           CustomerPolicyRepository customerPolicyRepository,
                           PaymentRepository paymentRepository,
                           PremiumRateConfigService rateConfigService,
                           RiderService riderService,
                           PolicyService policyService) {
        this.userRepository             = userRepository;
        this.authService                = authService;
        this.adminUserService           = adminUserService;
        this.kycService                 = kycService;
        this.auditLogRepository         = auditLogRepository;
        this.claimRepository           = claimRepository;
        this.customerPolicyRepository   = customerPolicyRepository;
        this.paymentRepository          = paymentRepository;
        this.rateConfigService          = rateConfigService;
        this.riderService               = riderService;
        this.policyService              = policyService;
    }

    // ═══════════════════════════════════════════════════════════════
    // User Listing
    // ═══════════════════════════════════════════════════════════════

    @GetMapping("/users")
    @Operation(summary = "Get all users in the system")
    public ResponseEntity<ApiResponse<List<UserResponse>>> getAllUsers() {
        List<UserResponse> users = userRepository.findAll().stream()
                .map(authService::mapToUserResponse)
                .collect(Collectors.toList());
        return ok("Users retrieved successfully", users);
    }

    @GetMapping("/users/{id}")
    @Operation(summary = "Get user by ID")
    public ResponseEntity<ApiResponse<UserResponse>> getUserById(@PathVariable UUID id) {
        User user = findUser(id);
        return ok("User retrieved successfully", authService.mapToUserResponse(user));
    }

    // ═══════════════════════════════════════════════════════════════
    // Account Status
    // ═══════════════════════════════════════════════════════════════

    @PutMapping("/users/{id}/status")
    @Operation(summary = "Update a user's account status (ACTIVE / SUSPENDED / DEACTIVATED)")
    public ResponseEntity<ApiResponse<UserResponse>> updateUserStatus(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateUserStatusRequest request,
            Authentication authentication) {

        AccountStatus status;
        try {
            status = AccountStatus.valueOf(request.getStatus().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Invalid status value. Use ACTIVE, SUSPENDED, or DEACTIVATED.");
        }

        User updated = adminUserService.updateAccountStatus(id, status, authentication.getName());
        return ok("User status updated to " + status, authService.mapToUserResponse(updated));
    }

    /**
     * Legacy toggle endpoint — kept for backwards compatibility.
     * Prefer PUT /users/{id}/status for explicit state control.
     */
    @PutMapping("/users/{id}/toggle-status")
    @Operation(summary = "Toggle a user's enabled flag (legacy endpoint)")
    public ResponseEntity<ApiResponse<UserResponse>> toggleUserStatus(@PathVariable UUID id) {
        User user = findUser(id);
        user.setEnabled(!user.isEnabled());
        user.setAccountStatus(user.isEnabled() ? AccountStatus.ACTIVE : AccountStatus.SUSPENDED);
        userRepository.save(user);
        return ok("User status toggled", authService.mapToUserResponse(user));
    }

    // ═══════════════════════════════════════════════════════════════
    // Password Reset
    // ═══════════════════════════════════════════════════════════════

    @PostMapping("/users/{id}/reset-password")
    @Operation(summary = "Admin triggers a password-reset email for the given user")
    public ResponseEntity<ApiResponse<Void>> resetPassword(
            @PathVariable UUID id,
            Authentication authentication,
            HttpServletRequest httpRequest) {

        String baseUrl = httpRequest.getScheme() + "://" + httpRequest.getServerName()
                + (httpRequest.getServerPort() != 80 && httpRequest.getServerPort() != 443
                   ? ":" + httpRequest.getServerPort() : "");

        adminUserService.triggerPasswordReset(id, authentication.getName(), baseUrl);
        return ok("Password reset email sent", null);
    }

    // ═══════════════════════════════════════════════════════════════
    // Role Change
    // ═══════════════════════════════════════════════════════════════

    @PutMapping("/users/{id}/role")
    @Operation(summary = "Change a user's primary role")
    public ResponseEntity<ApiResponse<UserResponse>> changeUserRole(
            @PathVariable UUID id,
            @Valid @RequestBody ChangeUserRoleRequest request,
            Authentication authentication) {

        ERole newRole;
        try {
            newRole = ERole.valueOf("ROLE_" + request.getRole().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException(
                    "Invalid role. Valid values: CUSTOMER, AGENT, CLAIMS_OFFICER, ADMIN.");
        }

        User updated = adminUserService.changeRole(id, newRole, authentication.getName());
        return ok("User role changed to " + request.getRole(), authService.mapToUserResponse(updated));
    }

    // ═══════════════════════════════════════════════════════════════
    // KYC Review
    // ═══════════════════════════════════════════════════════════════

    @GetMapping("/kyc/pending")
    @Operation(summary = "List users with pending KYC submissions and their documents")
    public ResponseEntity<ApiResponse<List<KycUserResponse>>> getPendingKyc() {
        return ok("Pending KYC users retrieved", kycService.getPendingKycUsers());
    }

    @PutMapping("/kyc/{userId}/verify")
    @Operation(summary = "Approve a user's KYC submission")
    public ResponseEntity<ApiResponse<Void>> verifyKyc(
            @PathVariable UUID userId,
            Authentication authentication) {
        kycService.verifyKyc(userId, authentication.getName());
        return ok("KYC verified successfully", null);
    }

    @PutMapping("/kyc/{userId}/reject")
    @Operation(summary = "Reject a user's KYC submission with an optional reason")
    public ResponseEntity<ApiResponse<Void>> rejectKyc(
            @PathVariable UUID userId,
            @RequestBody(required = false) KycDecisionRequest request,
            Authentication authentication) {
        String reason = request != null ? request.getRejectionReason() : null;
        kycService.rejectKyc(userId, reason, authentication.getName());
        return ok("KYC rejected", null);
    }

    // ═══════════════════════════════════════════════════════════════
    // Stats & Audit Logs
    // ═══════════════════════════════════════════════════════════════

    @GetMapping("/stats")
    @Operation(summary = "Get system statistics for admin dashboard")
    public ResponseEntity<ApiResponse<Object>> getSystemStats() {
        long totalUsers = userRepository.count();
        long pendingKyc = userRepository.countByKycStatus(KycStatus.PENDING);
        long totalClaims = claimRepository.count();
        long totalPolicies = customerPolicyRepository.count();
        
        java.math.BigDecimal totalRevenue = paymentRepository.sumAmountByStatus(com.insurance.entity.PaymentStatus.SUCCESS);

        var stats = java.util.Map.of(
                "totalUsers", totalUsers,
                "pendingKyc", pendingKyc,
                "totalClaims", totalClaims,
                "totalPolicies", totalPolicies,
                "totalRevenue", totalRevenue
        );
        return ok("System stats retrieved", stats);
    }

    @GetMapping("/audit-logs")
    @Operation(summary = "Retrieve audit logs with optional filters")
    public ResponseEntity<ApiResponse<List<Object>>> getAuditLogs(
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            @RequestParam(required = false) String entityType) {

        LocalDateTime fromDt = from != null ? LocalDateTime.parse(from) : null;
        LocalDateTime toDt   = to   != null ? LocalDateTime.parse(to)   : null;

        List<Object> logs = auditLogRepository.findWithFilters(fromDt, toDt, entityType)
                .stream()
                .map(a -> (Object) java.util.Map.of(
                        "id",          a.getId(),
                        "action",      a.getAction(),
                        "entityType",  a.getEntityType() != null ? a.getEntityType() : "",
                        "entityId",    a.getEntityId()   != null ? a.getEntityId()   : "",
                        "details",     a.getDetails()    != null ? a.getDetails()    : "",
                        "timestamp",   a.getTimestamp().toString()
                ))
                .collect(Collectors.toList());

        return ok("Audit logs retrieved", logs);
    }

    // ═══════════════════════════════════════════════════════════════
    // Helpers
    // ═══════════════════════════════════════════════════════════════

    private User findUser(UUID id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
    }

    private <T> ResponseEntity<ApiResponse<T>> ok(String message, T data) {
        return ResponseEntity.ok(ApiResponse.<T>builder()
                .success(true)
                .message(message)
                .data(data)
                .build());
    }

    // ═══════════════════════════════════════════════════════════════
    // Premium Rate Config Management (Phase 1)
    // ═══════════════════════════════════════════════════════════════

    @GetMapping("/rate-configs")
    @Operation(summary = "List all premium rate configs")
    public ResponseEntity<ApiResponse<List<PremiumRateConfigResponse>>> getAllRateConfigs() {
        return ok("Rate configs retrieved", rateConfigService.getAllConfigs());
    }

    @GetMapping("/rate-configs/{policyType}")
    @Operation(summary = "List rate configs filtered by policy type")
    public ResponseEntity<ApiResponse<List<PremiumRateConfigResponse>>> getRateConfigsByType(
            @PathVariable String policyType) {
        return ok("Rate configs retrieved", rateConfigService.getConfigsByType(policyType));
    }

    @PostMapping("/rate-configs")
    @Operation(summary = "Create a new rate config factor")
    public ResponseEntity<ApiResponse<PremiumRateConfigResponse>> createRateConfig(
            @Valid @RequestBody PremiumRateConfigRequest request) {
        return ok("Rate config created", rateConfigService.createConfig(request));
    }

    @PutMapping("/rate-configs/{id}")
    @Operation(summary = "Update an existing rate config factor value")
    public ResponseEntity<ApiResponse<PremiumRateConfigResponse>> updateRateConfig(
            @PathVariable UUID id, @Valid @RequestBody PremiumRateConfigRequest request) {
        return ok("Rate config updated", rateConfigService.updateConfig(id, request));
    }

    @PatchMapping("/rate-configs/{id}/toggle")
    @Operation(summary = "Toggle a rate config's active status")
    public ResponseEntity<ApiResponse<Void>> toggleRateConfig(@PathVariable UUID id) {
        rateConfigService.toggleActive(id);
        return ok("Rate config toggled", null);
    }

    // ═══════════════════════════════════════════════════════════════
    // Rider Management (Phase 1)
    // ═══════════════════════════════════════════════════════════════

    @GetMapping("/riders")
    @Operation(summary = "List all riders (active + inactive)")
    public ResponseEntity<ApiResponse<List<RiderResponse>>> getAllRiders() {
        return ok("Riders retrieved", riderService.getAllRiders());
    }

    @PostMapping("/riders")
    @Operation(summary = "Create a new rider add-on")
    public ResponseEntity<ApiResponse<RiderResponse>> createRider(
            @Valid @RequestBody RiderRequest request) {
        return ok("Rider created", riderService.createRider(request));
    }

    @PutMapping("/riders/{id}")
    @Operation(summary = "Update a rider's rate or description")
    public ResponseEntity<ApiResponse<RiderResponse>> updateRider(
            @PathVariable UUID id, @Valid @RequestBody RiderRequest request) {
        return ok("Rider updated", riderService.updateRider(id, request));
    }

    @PatchMapping("/riders/{id}/toggle")
    @Operation(summary = "Toggle a rider's active status")
    public ResponseEntity<ApiResponse<Void>> toggleRider(@PathVariable UUID id) {
        riderService.toggleActive(id);
        return ok("Rider toggled", null);
    }

    // ═══════════════════════════════════════════════════════════════
    // Reinstatement Requests Management (Phase 2)
    // ═══════════════════════════════════════════════════════════════

    @GetMapping("/reinstatements/pending")
    @Operation(summary = "Get list of all pending reinstatement requests (Admin only)")
    public ResponseEntity<ApiResponse<List<com.insurance.dto.policy.ReinstatementResponse>>> getPendingReinstatements() {
        return ok("Pending reinstatement requests retrieved", policyService.getPendingReinstatements());
    }

    @PostMapping("/reinstatements/{id}/approve")
    @Operation(summary = "Approve a pending policy reinstatement request (Admin only)")
    public ResponseEntity<ApiResponse<com.insurance.dto.policy.ReinstatementResponse>> approveReinstatement(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID id) {
        return ok("Reinstatement request approved successfully", policyService.approveReinstatement(id, userDetails.getId()));
    }

    @PostMapping("/reinstatements/{id}/reject")
    @Operation(summary = "Reject a pending policy reinstatement request (Admin only)")
    public ResponseEntity<ApiResponse<com.insurance.dto.policy.ReinstatementResponse>> rejectReinstatement(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID id,
            @RequestParam String reason) {
        return ok("Reinstatement request rejected", policyService.rejectReinstatement(id, userDetails.getId(), reason));
    }
}
