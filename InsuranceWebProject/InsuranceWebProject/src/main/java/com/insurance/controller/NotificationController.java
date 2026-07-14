package com.insurance.controller;

import com.insurance.dto.common.ApiResponse;
import com.insurance.entity.Notification;
import com.insurance.security.CustomUserDetails;
import com.insurance.service.NotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * REST endpoints for user notification management.
 *
 * @author Santhosh
 * @since 1.0
 */
@RestController
@RequestMapping("/api/notifications")
@Tag(name = "Notifications", description = "Endpoints for managing user notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    @Operation(summary = "Get all notifications for the current user")
    public ResponseEntity<ApiResponse<List<Notification>>> getNotifications(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        List<Notification> notifications = notificationService.getNotifications(userDetails.getId());
        return ResponseEntity.ok(ApiResponse.<List<Notification>>builder()
                .success(true)
                .message("Notifications retrieved")
                .data(notifications)
                .build());
    }

    @GetMapping("/unread")
    @Operation(summary = "Get unread notifications for the current user")
    public ResponseEntity<ApiResponse<List<Notification>>> getUnreadNotifications(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        List<Notification> unread = notificationService.getUnreadNotifications(userDetails.getId());
        return ResponseEntity.ok(ApiResponse.<List<Notification>>builder()
                .success(true)
                .message("Unread notifications retrieved")
                .data(unread)
                .build());
    }

    @GetMapping("/unread-count")
    @Operation(summary = "Get count of unread notifications")
    public ResponseEntity<ApiResponse<Long>> getUnreadCount(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        long count = notificationService.getUnreadCount(userDetails.getId());
        return ResponseEntity.ok(ApiResponse.<Long>builder()
                .success(true)
                .message("Unread count retrieved")
                .data(count)
                .build());
    }

    @PutMapping("/{id}/read")
    @Operation(summary = "Mark a specific notification as read")
    public ResponseEntity<ApiResponse<Notification>> markAsRead(@PathVariable UUID id) {
        Notification notification = notificationService.markAsRead(id);
        return ResponseEntity.ok(ApiResponse.<Notification>builder()
                .success(true)
                .message("Notification marked as read")
                .data(notification)
                .build());
    }

    @PutMapping("/read-all")
    @Operation(summary = "Mark all notifications as read for the current user")
    public ResponseEntity<ApiResponse<String>> markAllAsRead(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        notificationService.markAllAsRead(userDetails.getId());
        return ResponseEntity.ok(ApiResponse.<String>builder()
                .success(true)
                .message("All notifications marked as read")
                .data("Success")
                .build());
    }
}
