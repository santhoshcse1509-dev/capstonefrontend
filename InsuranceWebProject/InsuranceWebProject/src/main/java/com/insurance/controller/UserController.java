package com.insurance.controller;

import com.insurance.dto.common.ApiResponse;
import com.insurance.dto.user.ChangePasswordRequest;
import com.insurance.dto.user.UserNomineeDto;
import com.insurance.dto.user.KycSubmitRequest;
import com.insurance.dto.user.UserProfileUpdateRequest;
import com.insurance.dto.user.UserResponse;
import com.insurance.security.CustomUserDetails;
import com.insurance.service.KycService;
import com.insurance.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@Tag(name = "User Profile", description = "Endpoints for managing user profiles and nominees")
public class UserController {

    private final UserService userService;
    private final KycService kycService;

    public UserController(UserService userService, KycService kycService) {
        this.userService = userService;
        this.kycService = kycService;
    }

    @GetMapping("/profile")
    @Operation(summary = "Get the current user's profile")
    public ResponseEntity<ApiResponse<UserResponse>> getProfile(@AuthenticationPrincipal CustomUserDetails userDetails) {
        UserResponse response = userService.getUserProfile(userDetails.getId());
        return ResponseEntity.ok(ApiResponse.<UserResponse>builder()
                .success(true)
                .message("Profile retrieved successfully")
                .data(response)
                .build());
    }

    @GetMapping("/nominees")
    @Operation(summary = "Get the current user's nominees")
    public ResponseEntity<ApiResponse<List<UserNomineeDto>>> getNominees(@AuthenticationPrincipal CustomUserDetails userDetails) {
        List<UserNomineeDto> response = userService.getUserNominees(userDetails.getId());
        return ResponseEntity.ok(ApiResponse.<List<UserNomineeDto>>builder()
                .success(true)
                .message("Nominees retrieved successfully")
                .data(response)
                .build());
    }

    @PutMapping("/profile")
    @Operation(summary = "Update the current user's profile and nominees")
    public ResponseEntity<ApiResponse<UserResponse>> updateProfile(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestBody UserProfileUpdateRequest request) {
        UserResponse response = userService.updateProfile(userDetails.getId(), request);
        return ResponseEntity.ok(ApiResponse.<UserResponse>builder()
                .success(true)
                .message("Profile updated successfully")
                .data(response)
                .build());
    }

    @PostMapping("/change-password")
    @Operation(summary = "Change the current user's password")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody ChangePasswordRequest request) {
        userService.changePassword(userDetails.getId(), request);
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .success(true)
                .message("Password changed successfully")
                .build());
    }

    @PostMapping("/kyc/submit")
    @Operation(summary = "Submit KYC document for verification")
    public ResponseEntity<ApiResponse<Void>> submitKyc(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody KycSubmitRequest request) {
        kycService.submitKyc(userDetails.getId(), request);
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .success(true)
                .message("KYC submitted successfully and is pending verification")
                .build());
    }

    @PostMapping("/profile/upload-image")
    @Operation(summary = "Upload user profile image")
    public ResponseEntity<ApiResponse<String>> uploadProfileImage(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam("file") MultipartFile file) {
        String imageUrl = userService.uploadProfileImage(userDetails.getId(), file);
        return ResponseEntity.ok(ApiResponse.<String>builder()
                .success(true)
                .message("Image uploaded successfully")
                .data(imageUrl)
                .build());
    }
}
