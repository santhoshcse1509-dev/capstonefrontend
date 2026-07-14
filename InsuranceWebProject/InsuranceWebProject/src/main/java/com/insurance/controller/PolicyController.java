package com.insurance.controller;

import com.insurance.dto.common.ApiResponse;
import com.insurance.dto.policy.CustomerPolicyResponse;
import com.insurance.dto.policy.PolicyCreateRequest;
import com.insurance.dto.policy.PolicyResponse;
import com.insurance.dto.policy.PurchasePolicyRequest;
import com.insurance.dto.policy.QuoteRequest;
import com.insurance.dto.policy.QuoteResponse;
import com.insurance.dto.policy.RiderResponse;
import com.insurance.entity.PolicyType;
import com.insurance.security.CustomUserDetails;
import com.insurance.service.PolicyService;
import com.insurance.service.PremiumCalculatorService;
import com.insurance.service.RiderService;
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
@RequestMapping("/api/policies")
@Tag(name = "Policies", description = "Endpoints for viewing, quoting, and purchasing insurance policies")
public class PolicyController {

    private final PolicyService policyService;
    private final PremiumCalculatorService premiumCalculatorService;
    private final RiderService riderService;

    public PolicyController(PolicyService policyService,
                            PremiumCalculatorService premiumCalculatorService,
                            RiderService riderService) {
        this.policyService = policyService;
        this.premiumCalculatorService = premiumCalculatorService;
        this.riderService = riderService;
    }

    @GetMapping("/types")
    @Operation(summary = "Get all active policy types/categories")
    public ResponseEntity<ApiResponse<List<PolicyType>>> getPolicyTypes() {
        List<PolicyType> types = policyService.getActivePolicyTypes();
        return ResponseEntity.ok(ApiResponse.<List<PolicyType>>builder()
                .success(true)
                .message("Policy types retrieved successfully")
                .data(types)
                .build());
    }

    @GetMapping
    @Operation(summary = "Get all active policy templates")
    public ResponseEntity<ApiResponse<List<PolicyResponse>>> getActivePolicies() {
        List<PolicyResponse> policies = policyService.getActivePolicies();
        return ResponseEntity.ok(ApiResponse.<List<PolicyResponse>>builder()
                .success(true)
                .message("Policies retrieved successfully")
                .data(policies)
                .build());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get a policy details by ID")
    public ResponseEntity<ApiResponse<PolicyResponse>> getPolicyById(@PathVariable UUID id) {
        PolicyResponse policy = policyService.getPolicyById(id);
        return ResponseEntity.ok(ApiResponse.<PolicyResponse>builder()
                .success(true)
                .message("Policy details retrieved")
                .data(policy)
                .build());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Create a new policy template (Admin only)")
    public ResponseEntity<ApiResponse<PolicyResponse>> createPolicy(@Valid @RequestBody PolicyCreateRequest request) {
        PolicyResponse response = policyService.createPolicy(request);
        return ResponseEntity.ok(ApiResponse.<PolicyResponse>builder()
                .success(true)
                .message("Policy template created successfully")
                .data(response)
                .build());
    }

    @PostMapping("/purchase")
    @PreAuthorize("hasRole('CUSTOMER')")
    @Operation(summary = "Purchase a policy (Customer only)")
    public ResponseEntity<ApiResponse<CustomerPolicyResponse>> purchasePolicy(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody PurchasePolicyRequest request) {
        CustomerPolicyResponse response = policyService.purchasePolicy(userDetails.getId(), request);
        return ResponseEntity.ok(ApiResponse.<CustomerPolicyResponse>builder()
                .success(true)
                .message("Policy purchased successfully")
                .data(response)
                .build());
    }

    @GetMapping("/my-policies")
    @PreAuthorize("hasRole('CUSTOMER')")
    @Operation(summary = "Get all policies purchased by the current user")
    public ResponseEntity<ApiResponse<List<CustomerPolicyResponse>>> getMyPolicies(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        List<CustomerPolicyResponse> policies = policyService.getCustomerPolicies(userDetails.getId());
        return ResponseEntity.ok(ApiResponse.<List<CustomerPolicyResponse>>builder()
                .success(true)
                .message("User policies retrieved successfully")
                .data(policies)
                .build());
    }

    @PostMapping("/{customerPolicyId}/renew")
    @PreAuthorize("hasRole('CUSTOMER')")
    @Operation(summary = "Renew an existing customer policy")
    public ResponseEntity<ApiResponse<CustomerPolicyResponse>> renewPolicy(
            @PathVariable UUID customerPolicyId) {
        CustomerPolicyResponse response = policyService.renewPolicy(customerPolicyId);
        return ResponseEntity.ok(ApiResponse.<CustomerPolicyResponse>builder()
                .success(true)
                .message("Policy renewed successfully")
                .data(response)
                .build());
    }

    @PostMapping("/{customerPolicyId}/cancel")
    @PreAuthorize("hasRole('CUSTOMER')")
    @Operation(summary = "Cancel / surrender a customer policy")
    public ResponseEntity<ApiResponse<CustomerPolicyResponse>> cancelPolicy(
            @PathVariable UUID customerPolicyId,
            @RequestParam(required = false, defaultValue = "Customer request") String reason) {
        CustomerPolicyResponse response = policyService.cancelPolicy(customerPolicyId, "USER", reason);
        return ResponseEntity.ok(ApiResponse.<CustomerPolicyResponse>builder()
                .success(true)
                .message("Policy cancelled / surrendered successfully")
                .data(response)
                .build());
    }

    @PostMapping("/{customerPolicyId}/port")
    @PreAuthorize("hasRole('CUSTOMER')")
    @Operation(summary = "Port/transfer policy coverage to another plan")
    public ResponseEntity<ApiResponse<CustomerPolicyResponse>> portPolicy(
            @PathVariable UUID customerPolicyId,
            @RequestParam UUID targetPolicyId) {
        CustomerPolicyResponse response = policyService.portPolicyInternal(customerPolicyId, targetPolicyId);
        return ResponseEntity.ok(ApiResponse.<CustomerPolicyResponse>builder()
                .success(true)
                .message("Policy ported successfully")
                .data(response)
                .build());
    }

    @GetMapping("/{customerPolicyId}/surrender-value")
    @PreAuthorize("hasRole('CUSTOMER')")
    @Operation(summary = "Retrieve surrender value quote for policy cancellation")
    public ResponseEntity<ApiResponse<java.util.Map<String, Object>>> getSurrenderValue(
            @PathVariable UUID customerPolicyId) {
        java.util.Map<String, Object> quote = policyService.getSurrenderQuote(customerPolicyId);
        return ResponseEntity.ok(ApiResponse.<java.util.Map<String, Object>>builder()
                .success(true)
                .message("Surrender quote computed successfully")
                .data(quote)
                .build());
    }

    @GetMapping("/{customerPolicyId}/status-history")
    @PreAuthorize("hasRole('CUSTOMER') or hasRole('ADMIN')")
    @Operation(summary = "Get status transition history log for a policy")
    public ResponseEntity<ApiResponse<List<com.insurance.entity.PolicyStatusHistory>>> getStatusHistory(
            @PathVariable UUID customerPolicyId) {
        List<com.insurance.entity.PolicyStatusHistory> history = policyService.getHistoryForPolicy(customerPolicyId);
        return ResponseEntity.ok(ApiResponse.<List<com.insurance.entity.PolicyStatusHistory>>builder()
                .success(true)
                .message("Status history retrieved successfully")
                .data(history)
                .build());
    }

    @PostMapping("/{customerPolicyId}/endorsement/quote")
    @PreAuthorize("hasRole('CUSTOMER')")
    @Operation(summary = "Get premium quote impact for sum assured or rider change endorsement")
    public ResponseEntity<ApiResponse<java.util.Map<String, Object>>> quoteEndorsement(
            @PathVariable UUID customerPolicyId,
            @Valid @RequestBody com.insurance.dto.policy.EndorsementRequest request) {
        java.util.Map<String, Object> quote = policyService.calculateEndorsementQuote(customerPolicyId, request);
        return ResponseEntity.ok(ApiResponse.<java.util.Map<String, Object>>builder()
                .success(true)
                .message("Endorsement premium impact calculated")
                .data(quote)
                .build());
    }

    @PostMapping("/{customerPolicyId}/endorsement/apply")
    @PreAuthorize("hasRole('CUSTOMER')")
    @Operation(summary = "Apply nominee details, sum assured or rider change endorsement to active policy")
    public ResponseEntity<ApiResponse<com.insurance.dto.policy.EndorsementResponse>> applyEndorsement(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID customerPolicyId,
            @Valid @RequestBody com.insurance.dto.policy.EndorsementRequest request) {
        com.insurance.dto.policy.EndorsementResponse response = policyService.applyEndorsement(customerPolicyId, request, userDetails.getId());
        return ResponseEntity.ok(ApiResponse.<com.insurance.dto.policy.EndorsementResponse>builder()
                .success(true)
                .message("Policy endorsement applied successfully")
                .data(response)
                .build());
    }

    @GetMapping("/{customerPolicyId}/endorsements")
    @PreAuthorize("hasRole('CUSTOMER') or hasRole('ADMIN')")
    @Operation(summary = "Get list of applied endorsements on a policy")
    public ResponseEntity<ApiResponse<List<com.insurance.dto.policy.EndorsementResponse>>> getEndorsements(
            @PathVariable UUID customerPolicyId) {
        List<com.insurance.dto.policy.EndorsementResponse> list = policyService.getEndorsementsForPolicy(customerPolicyId);
        return ResponseEntity.ok(ApiResponse.<List<com.insurance.dto.policy.EndorsementResponse>>builder()
                .success(true)
                .message("Endorsements retrieved successfully")
                .data(list)
                .build());
    }

    @PostMapping("/{customerPolicyId}/reinstatement/request")
    @PreAuthorize("hasRole('CUSTOMER')")
    @Operation(summary = "Request reinstatement of a lapsed policy")
    public ResponseEntity<ApiResponse<com.insurance.dto.policy.ReinstatementResponse>> requestReinstatement(
            @PathVariable UUID customerPolicyId,
            @RequestParam java.math.BigDecimal overdueAmount) {
        com.insurance.dto.policy.ReinstatementResponse response = policyService.requestReinstatement(customerPolicyId, overdueAmount);
        return ResponseEntity.ok(ApiResponse.<com.insurance.dto.policy.ReinstatementResponse>builder()
                .success(true)
                .message("Reinstatement requested successfully. Pending Admin approval.")
                .data(response)
                .build());
    }

    @PostMapping("/quote")
    @Operation(summary = "Calculate a real-time premium quote before purchase")
    public ResponseEntity<ApiResponse<QuoteResponse>> getQuote(
            @Valid @RequestBody QuoteRequest request) {
        QuoteResponse quote = premiumCalculatorService.calculateQuote(request);
        return ResponseEntity.ok(ApiResponse.<QuoteResponse>builder()
                .success(true)
                .message("Premium quote calculated successfully")
                .data(quote)
                .build());
    }

    @GetMapping("/riders")
    @Operation(summary = "Get all active riders available for selection during purchase")
    public ResponseEntity<ApiResponse<List<RiderResponse>>> getActiveRiders() {
        List<RiderResponse> riders = riderService.getActiveRiders();
        return ResponseEntity.ok(ApiResponse.<List<RiderResponse>>builder()
                .success(true)
                .message("Active riders retrieved successfully")
                .data(riders)
                .build());
    }

    @GetMapping("/{customerPolicyId}/status")
    @Operation(summary = "Get status of customer policy for integration hooks (e.g. n8n)")
    public ResponseEntity<java.util.Map<String, String>> getPolicyStatus(@PathVariable UUID customerPolicyId) {
        CustomerPolicyResponse policy = policyService.getCustomerPolicyById(customerPolicyId);
        java.util.Map<String, String> response = new java.util.HashMap<>();
        response.put("status", policy.getStatus());
        return ResponseEntity.ok(response);
    }
}
