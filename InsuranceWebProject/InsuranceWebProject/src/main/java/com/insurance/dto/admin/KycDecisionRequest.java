package com.insurance.dto.admin;

import lombok.Data;

/**
 * Request body for KYC rejection containing an optional reason message.
 *
 * @author Santhosh
 * @since 1.0
 */
@Data
public class KycDecisionRequest {
    private String rejectionReason; // optional – only meaningful for reject
}
