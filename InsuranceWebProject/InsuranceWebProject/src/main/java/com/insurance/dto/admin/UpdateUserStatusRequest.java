package com.insurance.dto.admin;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * Request body for updating a user's account status.
 *
 * @author Santhosh
 * @since 1.0
 */
@Data
public class UpdateUserStatusRequest {
    @NotBlank(message = "Status is required")
    private String status; // ACTIVE | SUSPENDED | DEACTIVATED
}
