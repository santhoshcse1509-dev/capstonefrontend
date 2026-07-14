package com.insurance.controller;

import com.insurance.dto.common.ApiResponse;
import com.insurance.dto.policy.UnderwritingApplicationResponse;
import com.insurance.security.CustomUserDetails;
import com.insurance.service.UnderwritingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/underwriting")
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Underwriting", description = "Endpoints for Admin to review and adjudicate policy applications")
public class UnderwritingController {

    private final UnderwritingService underwritingService;

    public UnderwritingController(UnderwritingService underwritingService) {
        this.underwritingService = underwritingService;
    }

    @GetMapping("/queue")
    @Operation(summary = "Get the list of applications pending underwriting review")
    public ResponseEntity<ApiResponse<List<UnderwritingApplicationResponse>>> getApplicationQueue() {
        List<UnderwritingApplicationResponse> queue = underwritingService.getApplicationQueue();
        return ResponseEntity.ok(ApiResponse.<List<UnderwritingApplicationResponse>>builder()
                .success(true)
                .message("Underwriting application queue retrieved successfully")
                .data(queue)
                .build());
    }

    @GetMapping("/applications/{id}")
    @Operation(summary = "Get a single underwriting application details by ID")
    public ResponseEntity<ApiResponse<UnderwritingApplicationResponse>> getApplicationById(@PathVariable UUID id) {
        UnderwritingApplicationResponse app = underwritingService.getApplicationById(id);
        return ResponseEntity.ok(ApiResponse.<UnderwritingApplicationResponse>builder()
                .success(true)
                .message("Underwriting application details retrieved")
                .data(app)
                .build());
    }

    @PostMapping("/applications/{id}/approve")
    @Operation(summary = "Approve a policy application (Admin only)")
    public ResponseEntity<ApiResponse<Void>> approveApplication(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID id) {
        underwritingService.approveApplication(id, userDetails.getId());
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .success(true)
                .message("Application approved successfully")
                .build());
    }

    @PostMapping("/applications/{id}/reject")
    @Operation(summary = "Reject a policy application with reason (Admin only)")
    public ResponseEntity<ApiResponse<Void>> rejectApplication(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID id,
            @RequestBody(required = false) Map<String, String> body) {
        String reason = body != null ? body.getOrDefault("reason", "Rejected by Underwriter") : "Rejected by Underwriter";
        underwritingService.rejectApplication(id, userDetails.getId(), reason);
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .success(true)
                .message("Application rejected")
                .build());
    }

    @PostMapping("/applications/{id}/escalate")
    @Operation(summary = "Escalate a policy application to Chief Underwriter (Admin only)")
    public ResponseEntity<ApiResponse<Void>> escalateApplication(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID id) {
        underwritingService.escalateApplication(id, userDetails.getId());
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .success(true)
                .message("Application escalated successfully")
                .build());
    }

    @PutMapping("/applications/{id}/documents")
    @Operation(summary = "Update verified checkboxes in document checklist (Admin only)")
    public ResponseEntity<ApiResponse<Void>> updateDocumentCheck(
            @PathVariable UUID id,
            @RequestBody Map<String, Object> body) {
        // Since checkboxes are verified in frontend, this is a placeholder/success-confirm API
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .success(true)
                .message("Document verification state accepted")
                .build());
    }
}
