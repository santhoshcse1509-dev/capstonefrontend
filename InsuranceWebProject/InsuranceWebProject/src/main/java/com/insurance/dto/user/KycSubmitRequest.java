package com.insurance.dto.user;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class KycSubmitRequest {
    
    @NotBlank(message = "Proof of Identity type is required")
    private String proofType; // Aadhaar Card, Passport, PAN Card, Voter ID Card, Driving License

    @NotBlank(message = "Document URL/Path is required")
    private String documentUrl;
}
