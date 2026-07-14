package com.insurance.controller;

import com.insurance.dto.ai.ChatRequest;
import com.insurance.dto.ai.ChatResponse;
import com.insurance.dto.ai.RecommendationRequest;
import com.insurance.dto.ai.RecommendationResponse;
import com.insurance.dto.common.ApiResponse;
import com.insurance.security.CustomUserDetails;
import com.insurance.service.AIChatService;
import com.insurance.service.RecommendationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/ai")
@Tag(name = "AI Integration", description = "Endpoints for AI-powered chat and policy recommendations")
public class AIController {

    private final AIChatService aiChatService;
    private final RecommendationService recommendationService;

    public AIController(AIChatService aiChatService, RecommendationService recommendationService) {
        this.aiChatService = aiChatService;
        this.recommendationService = recommendationService;
    }

    @PostMapping("/chat")
    @Operation(summary = "Send a message to the AI Policy Assistant")
    public ResponseEntity<ApiResponse<ChatResponse>> chat(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody ChatRequest request) {
        ChatResponse response = aiChatService.chat(userDetails.getId(), request);
        return ResponseEntity.ok(ApiResponse.<ChatResponse>builder()
                .success(true)
                .message("AI Response generated")
                .data(response)
                .build());
    }

    @PostMapping("/recommend")
    @Operation(summary = "Get personalized insurance policy recommendation")
    public ResponseEntity<ApiResponse<RecommendationResponse>> recommend(
            @RequestBody RecommendationRequest request) {
        RecommendationResponse response = recommendationService.getRecommendation(request);
        return ResponseEntity.ok(ApiResponse.<RecommendationResponse>builder()
                .success(true)
                .message("Recommendation generated")
                .data(response)
                .build());
    }
}
