package com.insurance.dto.admin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

/**
 * Response DTO representing a user with pending KYC documents.
 *
 * @author Santhosh
 * @since 1.0
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class KycUserResponse {
    private UUID userId;
    private String firstName;
    private String lastName;
    private String email;
    private String phone;
    private String kycStatus;
    private List<KycDocumentDto> documents;

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class KycDocumentDto {
        private UUID id;
        private String documentType;
        private String fileName;
        private String fileUrl;
        private String mimeType;
        private Long fileSize;
    }
}
