package com.insurance.controller;

import com.insurance.dto.common.ApiResponse;
import com.insurance.entity.*;
import com.insurance.repository.CustomerPolicyRepository;
import com.insurance.service.NotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/agents")
@RequiredArgsConstructor
@Tag(name = "Agent Integration", description = "Endpoints for external system integrations (e.g. n8n)")
public class AgentController {

    private final CustomerPolicyRepository customerPolicyRepository;
    private final NotificationService notificationService;

    @PostMapping("/notify-followup")
    @Operation(summary = "Notify assigned agent to follow up on a customer policy (e.g. from n8n grace period sequences)")
    public ResponseEntity<ApiResponse<Void>> notifyAgentFollowup(@RequestBody Map<String, Object> request) {
        UUID policyId = UUID.fromString(request.get("policyId").toString());
        String customerName = request.get("customerName") != null ? request.get("customerName").toString() : "Customer";
        String reason = request.get("reason") != null ? request.get("reason").toString() : "Policy follow-up requested";

        CustomerPolicy policy = customerPolicyRepository.findById(policyId)
                .orElseThrow(() -> new IllegalArgumentException("Customer policy not found"));

        User agent = policy.getAgent();
        if (agent != null) {
            String title = "Grace Period Follow-up Request";
            String message = String.format("Action Required: Please follow up with customer %s. Reason: %s (Policy: %s)", 
                    customerName, reason, policy.getPolicyNumber());
            
            notificationService.createNotification(
                    agent.getId(),
                    title,
                    message,
                    NotificationType.WARNING,
                    NotificationCategory.POLICY_EXPIRY
            );
            
            return ResponseEntity.ok(ApiResponse.<Void>builder()
                    .success(true)
                    .message("Assigned agent notified successfully.")
                    .build());
        }

        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .success(true)
                .message("No agent assigned to this policy. Notification skipped.")
                .build());
    }
}
