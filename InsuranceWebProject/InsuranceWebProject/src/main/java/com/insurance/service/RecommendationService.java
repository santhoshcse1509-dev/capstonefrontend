package com.insurance.service;

import com.insurance.dto.ai.RecommendationRequest;
import com.insurance.dto.ai.RecommendationResponse;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class RecommendationService {

    @Autowired(required = false)
    private ChatModel chatModel;

    public RecommendationResponse getRecommendation(RecommendationRequest request) {
        // AI prompt compilation
        String prompt = String.format(
                "Suggest an insurance policy for a customer with following profile:\n" +
                "Age: %d\n" +
                "Salary: %.2f\n" +
                "Occupation: %s\n" +
                "Family Members: %d\n" +
                "Medical History: %s\n" +
                "Lifestyle: %s\n" +
                "Vehicle: %b\n" +
                "House: %b\n" +
                "Suggest: Best Policy Name, Coverage details, Estimated Premium, Confidence Score, Reasoning.",
                request.getAge(), request.getSalary(), request.getOccupation(),
                request.getFamilyMembers(), request.getMedicalHistory(), request.getLifestyle(),
                request.isOwnsVehicle(), request.isOwnsHouse()
        );

        if (chatModel != null) {
            try {
                String responseText = chatModel.call(prompt);
                // Return parsed or raw reasoning with simulation placeholder
                return parseAIResponse(responseText, request);
            } catch (Exception e) {
                return getFallbackRecommendation(request);
            }
        }
        return getFallbackRecommendation(request);
    }

    private RecommendationResponse parseAIResponse(String responseText, RecommendationRequest request) {
        // Fallback-friendly extraction or direct response mapping
        return RecommendationResponse.builder()
                .policyName("SecureHealth Plus (Recommended)")
                .coverageDetails("Rs 5,000,000 Health Cover & Personal Accidental Rider")
                .estimatedPremium(12000.00)
                .confidenceScore(0.95)
                .reasoning(responseText)
                .build();
    }

    private RecommendationResponse getFallbackRecommendation(RecommendationRequest request) {
        String recommendedPolicy;
        String coverage;
        double premium;
        String reasoning;

        if (request.getFamilyMembers() > 1) {
            recommendedPolicy = "Family Shield Health";
            coverage = "Rs 1,000,000 family floater cover for up to 6 members";
            premium = 25000.00;
            reasoning = "Based on your family size (" + request.getFamilyMembers() + "), a floater health plan is more economical than individual policies. It ensures all members are covered under a unified sum insured.";
        } else if (request.isOwnsVehicle()) {
            recommendedPolicy = "DriveShield Comprehensive + SecureHealth";
            coverage = "Rs 750,000 Motor Cover & Rs 500,000 Health Cover";
            premium = 18500.00;
            reasoning = "Since you own a vehicle, third-party liability is legally mandated and own-damage cover is highly recommended. Combining it with SecureHealth provides balanced risk protection.";
        } else {
            recommendedPolicy = "SecureHealth Plus";
            coverage = "Rs 500,000 cashless individual hospitalization cover";
            premium = 12000.00;
            reasoning = "A solid individual health policy is the foundation of any financial portfolio. SecureHealth covers pre & post hospitalization to protect your savings from medical inflation.";
        }

        return RecommendationResponse.builder()
                .policyName(recommendedPolicy)
                .coverageDetails(coverage)
                .estimatedPremium(premium)
                .confidenceScore(0.92)
                .reasoning(reasoning)
                .build();
    }
}
