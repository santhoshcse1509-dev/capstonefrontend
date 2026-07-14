package com.insurance.dto.admin;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * Request body for changing a user's primary role.
 *
 * @author Santhosh
 * @since 1.0
 */
@Data
public class ChangeUserRoleRequest {
    @NotBlank(message = "Role is required")
    private String role; // CUSTOMER | AGENT | CLAIMS_OFFICER | ADMIN
}
