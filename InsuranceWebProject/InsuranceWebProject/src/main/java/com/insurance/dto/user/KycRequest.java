package com.insurance.dto.user;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class KycRequest {
    @NotBlank(message = "Document type is required")
    private String documentType;
    
    @NotBlank(message = "Document number is required")
    private String documentNumber;
    
    private LocalDate dateOfBirth;
}
