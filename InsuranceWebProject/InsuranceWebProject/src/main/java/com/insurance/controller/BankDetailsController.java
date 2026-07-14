package com.insurance.controller;

import com.insurance.dto.bank.BankDetailsRequest;
import com.insurance.dto.bank.BankDetailsResponse;
import com.insurance.dto.common.ApiResponse;
import com.insurance.security.CustomUserDetails;
import com.insurance.service.BankDetailsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/bank-details")
@RequiredArgsConstructor
@Tag(name = "Bank Details", description = "Endpoints for managing customer and agent bank accounts")
public class BankDetailsController {

    private final BankDetailsService bankDetailsService;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get list of bank accounts for current user")
    public ResponseEntity<ApiResponse<List<BankDetailsResponse>>> getMyBankDetails(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        List<BankDetailsResponse> details = bankDetailsService.getBankDetails(userDetails.getId());
        return ResponseEntity.ok(ApiResponse.<List<BankDetailsResponse>>builder()
                .success(true)
                .message("Bank details retrieved successfully")
                .data(details)
                .build());
    }

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Add a new bank account (requires OTP: 123456)")
    public ResponseEntity<ApiResponse<BankDetailsResponse>> addBankDetails(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestBody BankDetailsRequest request) {
        String ownerType = userDetails.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_AGENT")) ? "AGENT" : "CUSTOMER";

        BankDetailsResponse response = bankDetailsService.addBankDetails(userDetails.getId(), ownerType, request);
        return ResponseEntity.ok(ApiResponse.<BankDetailsResponse>builder()
                .success(true)
                .message("Bank details added successfully. Penny-drop verification required.")
                .data(response)
                .build());
    }

    @PutMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Update bank account details (requires OTP: 123456)")
    public ResponseEntity<ApiResponse<BankDetailsResponse>> updateBankDetails(
            @PathVariable UUID id,
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestBody BankDetailsRequest request) {
        BankDetailsResponse response = bankDetailsService.updateBankDetails(id, userDetails.getId(), request);
        return ResponseEntity.ok(ApiResponse.<BankDetailsResponse>builder()
                .success(true)
                .message("Bank details updated successfully.")
                .data(response)
                .build());
    }

    @PostMapping("/{id}/verify")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Perform penny-drop verification (enter ₹1.00 to verify)")
    public ResponseEntity<ApiResponse<Boolean>> verifyBankDetails(
            @PathVariable UUID id,
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestBody Map<String, Object> body) {
        BigDecimal amount = new BigDecimal(body.get("amount").toString());
        boolean success = bankDetailsService.verifyBankDetails(id, userDetails.getId(), amount);
        
        if (success) {
            return ResponseEntity.ok(ApiResponse.<Boolean>builder()
                    .success(true)
                    .message("Bank details verified successfully.")
                    .data(true)
                    .build());
        } else {
            return ResponseEntity.badRequest().body(ApiResponse.<Boolean>builder()
                    .success(false)
                    .message("Verification failed. Incorrect penny-drop amount.")
                    .data(false)
                    .build());
        }
    }

    @PostMapping("/{id}/make-primary")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Mark a bank account as primary for payouts")
    public ResponseEntity<ApiResponse<BankDetailsResponse>> makePrimary(
            @PathVariable UUID id,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        BankDetailsResponse response = bankDetailsService.makePrimary(id, userDetails.getId());
        return ResponseEntity.ok(ApiResponse.<BankDetailsResponse>builder()
                .success(true)
                .message("Primary bank account updated successfully.")
                .data(response)
                .build());
    }

    @PostMapping("/{id}/reauthorize")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Re-authorize a debit bank details mandate")
    public ResponseEntity<ApiResponse<BankDetailsResponse>> reauthorizeMandate(
            @PathVariable UUID id,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        BankDetailsResponse response = bankDetailsService.reauthorizeMandate(id, userDetails.getId());
        return ResponseEntity.ok(ApiResponse.<BankDetailsResponse>builder()
                .success(true)
                .message("Bank mandate re-authorized successfully.")
                .data(response)
                .build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Delete a bank details record (requires OTP parameter: otpCode=123456)")
    public ResponseEntity<ApiResponse<Void>> deleteBankDetails(
            @PathVariable UUID id,
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam String otpCode) {
        bankDetailsService.deleteBankDetails(id, userDetails.getId(), otpCode);
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .success(true)
                .message("Bank details removed successfully.")
                .build());
    }
}
