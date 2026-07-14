package com.insurance.controller;

import com.insurance.dto.common.ApiResponse;
import com.insurance.dto.payment.PaymentRequest;
import com.insurance.dto.payment.PaymentResponse;
import com.insurance.security.CustomUserDetails;
import com.insurance.service.PaymentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/payments")
@Tag(name = "Payments", description = "Endpoints for premium payments and invoice generation")
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @PostMapping
    @PreAuthorize("hasRole('CUSTOMER')")
    @Operation(summary = "Make a premium payment (Customer only)")
    public ResponseEntity<ApiResponse<PaymentResponse>> makePayment(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody PaymentRequest request) {
        PaymentResponse response = paymentService.makePayment(userDetails.getId(), request);
        return ResponseEntity.ok(ApiResponse.<PaymentResponse>builder()
                .success(true)
                .message("Payment successful")
                .data(response)
                .build());
    }

    @PostMapping("/razorpay/create-order")
    @PreAuthorize("hasRole('CUSTOMER')")
    @Operation(summary = "Create a Razorpay order for premium payment (Customer only)")
    public ResponseEntity<ApiResponse<com.insurance.dto.payment.RazorpayOrderResponse>> createRazorpayOrder(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam java.util.UUID customerPolicyId,
            @RequestParam java.math.BigDecimal amount) {
        com.insurance.dto.payment.RazorpayOrderResponse response = paymentService.createRazorpayOrder(userDetails.getId(), customerPolicyId, amount);
        return ResponseEntity.ok(ApiResponse.<com.insurance.dto.payment.RazorpayOrderResponse>builder()
                .success(true)
                .message("Razorpay order created successfully")
                .data(response)
                .build());
    }

    @PostMapping("/razorpay/verify")
    @PreAuthorize("hasRole('CUSTOMER')")
    @Operation(summary = "Verify Razorpay payment signature and record payment (Customer only)")
    public ResponseEntity<ApiResponse<PaymentResponse>> verifyRazorpayPayment(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody com.insurance.dto.payment.RazorpayVerifyRequest request) {
        PaymentResponse response = paymentService.verifyRazorpayPayment(userDetails.getId(), request);
        return ResponseEntity.ok(ApiResponse.<PaymentResponse>builder()
                .success(true)
                .message("Razorpay payment verified and recorded successfully")
                .data(response)
                .build());
    }

    @GetMapping("/my-payments")
    @PreAuthorize("hasRole('CUSTOMER')")
    @Operation(summary = "Get current user's payment history")
    public ResponseEntity<ApiResponse<List<PaymentResponse>>> getMyPaymentHistory(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        List<PaymentResponse> history = paymentService.getMyPaymentHistory(userDetails.getId());
        return ResponseEntity.ok(ApiResponse.<List<PaymentResponse>>builder()
                .success(true)
                .message("Payment history retrieved successfully")
                .data(history)
                .build());
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get all system payments (Admin only)")
    public ResponseEntity<ApiResponse<List<PaymentResponse>>> getAllPayments() {
        List<PaymentResponse> payments = paymentService.getAllPayments();
        return ResponseEntity.ok(ApiResponse.<List<PaymentResponse>>builder()
                .success(true)
                .message("All payments retrieved successfully")
                .data(payments)
                .build());
    }
}
