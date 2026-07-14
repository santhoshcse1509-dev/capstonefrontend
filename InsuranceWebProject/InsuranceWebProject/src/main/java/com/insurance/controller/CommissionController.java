package com.insurance.controller;

import com.insurance.dto.common.ApiResponse;
import com.insurance.entity.AgentTier;
import com.insurance.entity.CommissionLedger;
import com.insurance.entity.CommissionRate;
import com.insurance.entity.PolicyType;
import com.insurance.entity.User;
import com.insurance.repository.CommissionLedgerRepository;
import com.insurance.repository.CommissionRateRepository;
import com.insurance.repository.PolicyTypeRepository;
import com.insurance.repository.UserRepository;
import com.insurance.security.CustomUserDetails;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/commissions")
@RequiredArgsConstructor
@Tag(name = "Commissions", description = "Endpoints for agent commissions, hierarchy, and config")
public class CommissionController {

    private final CommissionLedgerRepository ledgerRepository;
    private final CommissionRateRepository rateRepository;
    private final PolicyTypeRepository policyTypeRepository;
    private final UserRepository userRepository;
    private final com.insurance.service.CommissionService commissionService;

    @GetMapping("/my-ledger")
    @PreAuthorize("hasAnyRole('AGENT', 'ADMIN')")
    @Operation(summary = "Get commission ledger details for currently logged-in agent")
    public ResponseEntity<ApiResponse<List<CommissionLedger>>> getMyLedger(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        List<CommissionLedger> ledger = ledgerRepository.findByAgentId(userDetails.getId());
        return ResponseEntity.ok(ApiResponse.<List<CommissionLedger>>builder()
                .success(true)
                .message("Ledger retrieved successfully")
                .data(ledger)
                .build());
    }

    @GetMapping("/rates")
    @PreAuthorize("hasAnyRole('ADMIN', 'AGENT')")
    @Operation(summary = "Get all commission rate configurations")
    public ResponseEntity<ApiResponse<List<CommissionRate>>> getRates() {
        List<CommissionRate> rates = rateRepository.findAll();
        return ResponseEntity.ok(ApiResponse.<List<CommissionRate>>builder()
                .success(true)
                .message("Rates retrieved successfully")
                .data(rates)
                .build());
    }

    @PostMapping("/rates")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Configure or update a commission rate (Admin only)")
    public ResponseEntity<ApiResponse<CommissionRate>> saveRate(@RequestBody Map<String, Object> request) {
        String typeName = (String) request.get("productCategoryName");
        String tierStr = (String) request.get("agentTier");
        BigDecimal baseRate = new BigDecimal(request.get("baseRate").toString());
        BigDecimal tierBonusRate = new BigDecimal(request.get("tierBonusRate").toString());

        PolicyType policyType = policyTypeRepository.findByName(typeName)
                .orElseThrow(() -> new IllegalArgumentException("Product category not found"));
        AgentTier tier = AgentTier.valueOf(tierStr.toUpperCase());

        CommissionRate rate = rateRepository.findByProductCategoryIdAndAgentTier(policyType.getId(), tier)
                .orElse(new CommissionRate());

        rate.setProductCategory(policyType);
        rate.setAgentTier(tier);
        rate.setBaseRate(baseRate);
        rate.setTierBonusRate(tierBonusRate);

        CommissionRate saved = rateRepository.save(rate);

        return ResponseEntity.ok(ApiResponse.<CommissionRate>builder()
                .success(true)
                .message("Rate configured successfully")
                .data(saved)
                .build());
    }

    @GetMapping("/portal-stats")
    @PreAuthorize("hasAnyRole('AGENT', 'ADMIN')")
    @Operation(summary = "Get Agent Portal stats (Book of business, leads, and earnings)")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getPortalStats(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        UUID agentId = userDetails.getId();
        User agent = userRepository.findById(agentId)
                .orElseThrow(() -> new IllegalArgumentException("Agent not found"));

        List<CommissionLedger> ledger = ledgerRepository.findByAgentId(agentId);
        
        Map<String, Object> stats = new HashMap<>();
        stats.put("agentName", agent.getFirstName() + " " + agent.getLastName());
        stats.put("tier", agent.getAgentTier() != null ? agent.getAgentTier().name() : "AGENT");
        stats.put("lifetimeCommission", agent.getLifetimeCommission());
        stats.put("customerCount", agent.getCustomerCount());
        stats.put("ledger", ledger);

        return ResponseEntity.ok(ApiResponse.<Map<String, Object>>builder()
                .success(true)
                .message("Portal stats retrieved successfully")
                .data(stats)
                .build());
    }

    @PostMapping("/{ledgerId}/pay")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Disburse commission payout to agent bank account")
    public ResponseEntity<ApiResponse<Void>> payCommission(
            @PathVariable UUID ledgerId,
            @RequestBody Map<String, Object> request) {
        UUID bankDetailsId = UUID.fromString(request.get("bankDetailsId").toString());
        commissionService.markCommissionAsPaid(ledgerId, bankDetailsId);
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .success(true)
                .message("Commission payout processed successfully.")
                .build());
    }
}
