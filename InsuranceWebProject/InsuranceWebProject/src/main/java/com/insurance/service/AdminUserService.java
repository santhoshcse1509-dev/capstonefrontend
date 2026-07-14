package com.insurance.service;

import com.insurance.entity.*;
import com.insurance.exception.BadRequestException;
import com.insurance.exception.ResourceNotFoundException;
import com.insurance.repository.AuditLogRepository;
import com.insurance.repository.RoleRepository;
import com.insurance.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.util.Collections;
import java.util.UUID;

/**
 * Service handling admin-level user management operations:
 * account status changes, password resets, and role changes.
 * Every mutation is recorded to the AuditLog.
 *
 * @author Santhosh
 * @since 1.0
 */
@Slf4j
@Service
public class AdminUserService {

    private static final String RESET_TOKEN_PREFIX = "pwd_reset:";
    private static final Duration RESET_TOKEN_TTL   = Duration.ofMinutes(15);

    private final UserRepository      userRepository;
    private final RoleRepository      roleRepository;
    private final AuditLogRepository  auditLogRepository;
    private final EmailService        emailService;
    private final StringRedisTemplate redisTemplate;
    private final PasswordEncoder     passwordEncoder;

    public AdminUserService(UserRepository userRepository,
                            RoleRepository roleRepository,
                            AuditLogRepository auditLogRepository,
                            EmailService emailService,
                            StringRedisTemplate redisTemplate,
                            PasswordEncoder passwordEncoder) {
        this.userRepository     = userRepository;
        this.roleRepository     = roleRepository;
        this.auditLogRepository = auditLogRepository;
        this.emailService       = emailService;
        this.redisTemplate      = redisTemplate;
        this.passwordEncoder    = passwordEncoder;
    }

    // ─────────────────────────────────────────────────────────────
    // Account Status
    // ─────────────────────────────────────────────────────────────

    /**
     * Updates a user's account status and synchronises the Spring Security
     * {@code enabled}/{@code accountNonLocked} flags accordingly.
     *
     * @param userId      target user UUID
     * @param newStatus   desired AccountStatus (ACTIVE/SUSPENDED/DEACTIVATED)
     * @param adminEmail  email of the admin performing the action (for audit)
     */
    @Transactional
    public User updateAccountStatus(UUID userId, AccountStatus newStatus, String adminEmail) {
        User user = findUserById(userId);
        AccountStatus oldStatus = user.getAccountStatus() != null
                ? user.getAccountStatus() : AccountStatus.ACTIVE;

        user.setAccountStatus(newStatus);
        // Keep Spring Security flags in sync
        switch (newStatus) {
            case ACTIVE       -> { user.setEnabled(true);  user.setAccountNonLocked(true);  }
            case SUSPENDED    -> { user.setEnabled(true);  user.setAccountNonLocked(false); }
            case DEACTIVATED  -> { user.setEnabled(false); user.setAccountNonLocked(false); }
        }

        User saved = userRepository.save(user);
        logAudit(adminEmail, "UPDATE_ACCOUNT_STATUS", "User", userId.toString(),
                oldStatus.name(), newStatus.name());
        emailService.sendAccountStatusEmail(user.getEmail(), newStatus.name());
        return saved;
    }

    // ─────────────────────────────────────────────────────────────
    // Password Reset
    // ─────────────────────────────────────────────────────────────

    /**
     * Generates a one-time password-reset token (stored in Redis for 15 min)
     * and emails the reset link to the user.
     *
     * @param userId     target user UUID
     * @param adminEmail email of the performing admin (for audit)
     * @param baseUrl    frontend base URL used to construct the reset link
     */
    @Transactional
    public void triggerPasswordReset(UUID userId, String adminEmail, String baseUrl) {
        User user = findUserById(userId);
        String token = UUID.randomUUID().toString();
        redisTemplate.opsForValue().set(RESET_TOKEN_PREFIX + token, user.getEmail(), RESET_TOKEN_TTL);

        String resetLink = baseUrl + "/reset-password?token=" + token;
        emailService.sendPasswordResetEmail(user.getEmail(), resetLink);
        logAudit(adminEmail, "ADMIN_PASSWORD_RESET", "User", userId.toString(), null, "reset email sent");
        log.info("Password reset triggered for user {} by admin {}", user.getEmail(), adminEmail);
    }

    // ─────────────────────────────────────────────────────────────
    // Role Change
    // ─────────────────────────────────────────────────────────────

    /**
     * Replaces a user's current roles with a single new role.
     * Guards against demoting the last remaining Admin.
     *
     * @param userId     target user UUID
     * @param newERole   the desired ERole constant
     * @param adminEmail performing admin email (for audit)
     */
    @Transactional
    public User changeRole(UUID userId, ERole newERole, String adminEmail) {
        User user = findUserById(userId);

        // Guard: cannot demote the last admin
        boolean isCurrentlyAdmin = user.getRoles().stream()
                .anyMatch(r -> r.getName() == ERole.ROLE_ADMIN);
        if (isCurrentlyAdmin && newERole != ERole.ROLE_ADMIN) {
            long adminCount = userRepository.countByRoleName(ERole.ROLE_ADMIN);
            if (adminCount <= 1) {
                throw new BadRequestException(
                        "Cannot demote this user — they are the last remaining Admin.");
            }
        }

        String oldRoles = user.getRoles().stream()
                .map(r -> r.getName().name()).reduce("", (a, b) -> a + "," + b);

        Role newRole = roleRepository.findByName(newERole)
                .orElseThrow(() -> new ResourceNotFoundException("Role not found: " + newERole));
        user.setRoles(Collections.singleton(newRole));

        User saved = userRepository.save(user);
        logAudit(adminEmail, "CHANGE_ROLE", "User", userId.toString(), oldRoles, newERole.name());
        return saved;
    }

    // ─────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────

    private User findUserById(UUID id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
    }

    private void logAudit(String adminEmail, String action, String entityType,
                          String entityId, String oldValue, String newValue) {
        AuditLog log = AuditLog.builder()
                .action(action)
                .entityType(entityType)
                .entityId(entityId)
                .details(String.format("Admin: %s | old=%s | new=%s", adminEmail, oldValue, newValue))
                .build();
        auditLogRepository.save(log);
    }
}
