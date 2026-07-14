package com.insurance.dto.ai;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class RecommendationRequest {
    private int age;
    private double salary;
    private String occupation;
    private int familyMembers;
    private String medicalHistory;
    private String lifestyle;
    private String existingPolicies;
    private boolean ownsVehicle;
    private boolean ownsHouse;
}
