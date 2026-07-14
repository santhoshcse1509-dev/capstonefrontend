package com.insurance.dto.ai;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class RecommendationResponse {
    private String policyName;
    private String coverageDetails;
    private double estimatedPremium;
    private double confidenceScore;
    private String reasoning;
}
