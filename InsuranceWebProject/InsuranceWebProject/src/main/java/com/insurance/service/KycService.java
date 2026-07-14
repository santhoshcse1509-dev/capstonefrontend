package com.insurance.service;

import com.insurance.dto.admin.KycUserResponse;
import com.insurance.dto.user.KycSubmitRequest;
import com.insurance.entity.*;
import com.insurance.exception.BadRequestException;
import com.insurance.exception.ResourceNotFoundException;
import com.insurance.repository.AuditLogRepository;
import com.insurance.repository.DocumentRepository;
import com.insurance.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Service for KYC document verification workflow.
 * <p>
 * Lists users with pending KYC submissions and allows admins to
 * approve or reject them with email notification and audit logging.
 *
 * @author Santhosh
 * @since 1.0
 */
@Slf4j
@Service
public class KycService {

    private final UserRepository     userRepository;
    private final DocumentRepository documentRepository;
    private final AuditLogRepository auditLogRepository;
    private final EmailService       emailService;
    private final NotificationService notificationService;

    public KycService(UserRepository userRepository,
                      DocumentRepository documentRepository,
                      AuditLogRepository auditLogRepository,
                      EmailService emailService,
                      NotificationService notificationService) {
        this.userRepository      = userRepository;
        this.documentRepository  = documentRepository;
        this.auditLogRepository  = auditLogRepository;
        this.emailService        = emailService;
        this.notificationService = notificationService;
    }

    // ─────────────────────────────────────────────────────────────
    // Queries
    // ─────────────────────────────────────────────────────────────

    /**
     * Returns all users whose {@code kycStatus} is PENDING together
     * with their uploaded KYC documents.
     */
    public List<KycUserResponse> getPendingKycUsers() {
        return userRepository.findByKycStatus(KycStatus.PENDING).stream()
                .map(this::mapToKycUserResponse)
                .collect(Collectors.toList());
    }

    // ─────────────────────────────────────────────────────────────
    // Decisions
    // ─────────────────────────────────────────────────────────────

    /**
     * Marks a user's KYC as VERIFIED, sends an approval email, creates
     * an in-app notification, and logs the audit event.
     *
     * @param userId     the user whose KYC is being approved
     * @param adminEmail email of the approving admin
     */
    @Transactional
    public void verifyKyc(UUID userId, String adminEmail) {
        User user = findUserById(userId);
        String oldStatus = user.getKycStatus() != null ? user.getKycStatus().name() : "PENDING";
        user.setKycStatus(KycStatus.VERIFIED);
        userRepository.save(user);

        emailService.sendKycDecisionEmail(user.getEmail(), true, null);
        notificationService.createNotification(userId,
                "KYC Verified",
                "Your KYC documents have been verified successfully.",
                NotificationType.INFO,
                NotificationCategory.ACCOUNT);
        logAudit(adminEmail, "KYC_VERIFIED", "User", userId.toString(), oldStatus, "VERIFIED");
        log.info("KYC verified for user {} by admin {}", userId, adminEmail);
    }

    /**
     * Marks a user's KYC as REJECTED with an optional reason, sends a
     * rejection email, creates an in-app notification, and logs the audit event.
     *
     * @param userId           the user whose KYC is being rejected
     * @param rejectionReason  human-readable reason (may be null)
     * @param adminEmail       email of the rejecting admin
     */
    @Transactional
    public void rejectKyc(UUID userId, String rejectionReason, String adminEmail) {
        User user = findUserById(userId);
        String oldStatus = user.getKycStatus() != null ? user.getKycStatus().name() : "PENDING";
        user.setKycStatus(KycStatus.REJECTED);
        userRepository.save(user);

        emailService.sendKycDecisionEmail(user.getEmail(), false, rejectionReason);
        notificationService.createNotification(userId,
                "KYC Verification Failed",
                "Your KYC submission was rejected. " +
                (rejectionReason != null ? "Reason: " + rejectionReason : "Please re-submit."),
                NotificationType.WARNING,
                NotificationCategory.ACCOUNT);
        logAudit(adminEmail, "KYC_REJECTED", "User", userId.toString(), oldStatus,
                "REJECTED | reason=" + rejectionReason);
        log.info("KYC rejected for user {} by admin {}", userId, adminEmail);
    }

    /**
     * Submits KYC document for a user.
     *
     * @param userId the user submitting KYC
     * @param request the KYC submission request
     */
    @Transactional
    public void submitKyc(UUID userId, KycSubmitRequest request) {
        User user = findUserById(userId);

        List<String> validProofs = Arrays.asList("Aadhaar Card", "Passport", "PAN Card", "Voter ID Card", "Driving License");
        if (!validProofs.contains(request.getProofType())) {
            throw new BadRequestException("Invalid Proof of Identity. Must be one of: " + String.join(", ", validProofs));
        }

        Document doc = Document.builder()
                .user(user)
                .documentType(DocumentType.KYC)
                .fileName(request.getProofType())
                .fileUrl(request.getDocumentUrl())
                .mimeType("application/pdf")
                .verified(false)
                .build();
        documentRepository.save(doc);

        user.setKycStatus(KycStatus.PENDING);
        userRepository.save(user);
    }

    // ─────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────

    private User findUserById(UUID id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
    }

    private KycUserResponse mapToKycUserResponse(User user) {
        List<KycUserResponse.KycDocumentDto> docs = documentRepository
                .findByUserIdAndDocumentType(user.getId(), DocumentType.KYC)
                .stream()
                .map(d -> KycUserResponse.KycDocumentDto.builder()
                        .id(d.getId())
                        .documentType(d.getDocumentType().name())
                        .fileName(d.getFileName())
                        .fileUrl(d.getFileUrl())
                        .mimeType(d.getMimeType())
                        .fileSize(d.getFileSize())
                        .build())
                .collect(Collectors.toList());

        return KycUserResponse.builder()
                .userId(user.getId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .kycStatus(user.getKycStatus() != null ? user.getKycStatus().name() : "PENDING")
                .documents(docs)
                .build();
    }

    private void logAudit(String adminEmail, String action, String entityType,
                          String entityId, String oldValue, String newValue) {
        AuditLog audit = AuditLog.builder()
                .action(action)
                .entityType(entityType)
                .entityId(entityId)
                .details(String.format("Admin: %s | old=%s | new=%s", adminEmail, oldValue, newValue))
                .build();
        auditLogRepository.save(audit);
    }
}
