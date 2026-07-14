package com.insurance.controller;

import com.insurance.dto.claim.ClaimRequest;
import com.insurance.dto.claim.ClaimResponse;
import com.insurance.dto.claim.ClaimStatusUpdateRequest;
import com.insurance.dto.common.ApiResponse;
import com.insurance.security.CustomUserDetails;
import com.insurance.service.ClaimService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/claims")
@Tag(name = "Claims", description = "Endpoints for claim submission, review, and tracking")
public class ClaimController {

    private final ClaimService claimService;

    public ClaimController(ClaimService claimService) {
        this.claimService = claimService;
    }

    @PostMapping
    @PreAuthorize("hasRole('CUSTOMER')")
    @Operation(summary = "Submit a new claim (Customer only)")
    public ResponseEntity<ApiResponse<ClaimResponse>> submitClaim(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody ClaimRequest request) {
        ClaimResponse response = claimService.submitClaim(userDetails.getId(), request);
        return ResponseEntity.ok(ApiResponse.<ClaimResponse>builder()
                .success(true)
                .message("Claim submitted successfully")
                .data(response)
                .build());
    }

    @GetMapping("/my-claims")
    @PreAuthorize("hasRole('CUSTOMER')")
    @Operation(summary = "Get claims submitted by the current customer")
    public ResponseEntity<ApiResponse<List<ClaimResponse>>> getMyClaims(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        List<ClaimResponse> claims = claimService.getMyClaims(userDetails.getId());
        return ResponseEntity.ok(ApiResponse.<List<ClaimResponse>>builder()
                .success(true)
                .message("Claims retrieved successfully")
                .data(claims)
                .build());
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('CLAIMS_OFFICER', 'ADMIN')")
    @Operation(summary = "Get all submitted claims (Claims Officer/Admin only)")
    public ResponseEntity<ApiResponse<List<ClaimResponse>>> getAllClaims() {
        List<ClaimResponse> claims = claimService.getAllClaims();
        return ResponseEntity.ok(ApiResponse.<List<ClaimResponse>>builder()
                .success(true)
                .message("All claims retrieved successfully")
                .data(claims)
                .build());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get claim details by ID")
    public ResponseEntity<ApiResponse<ClaimResponse>> getClaimById(@PathVariable UUID id) {
        ClaimResponse claim = claimService.getClaimById(id);
        return ResponseEntity.ok(ApiResponse.<ClaimResponse>builder()
                .success(true)
                .message("Claim details retrieved successfully")
                .data(claim)
                .build());
    }

    @GetMapping("/{id}/history")
    @Operation(summary = "Get claim history timeline by ID")
    public ResponseEntity<ApiResponse<List<com.insurance.dto.claim.ClaimHistoryResponse>>> getClaimHistory(@PathVariable UUID id) {
        List<com.insurance.dto.claim.ClaimHistoryResponse> history = claimService.getClaimHistory(id);
        return ResponseEntity.ok(ApiResponse.<List<com.insurance.dto.claim.ClaimHistoryResponse>>builder()
                .success(true)
                .message("Claim history retrieved successfully")
                .data(history)
                .build());
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('CLAIMS_OFFICER', 'ADMIN')")
    @Operation(summary = "Update claim status and details (Claims Officer/Admin only)")
    public ResponseEntity<ApiResponse<ClaimResponse>> updateClaimStatus(
            @PathVariable UUID id,
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody ClaimStatusUpdateRequest request) {
        ClaimResponse response = claimService.updateClaimStatus(id, userDetails.getId(), request);
        return ResponseEntity.ok(ApiResponse.<ClaimResponse>builder()
                .success(true)
                .message("Claim status updated successfully")
                .data(response)
                .build());
    }
}
