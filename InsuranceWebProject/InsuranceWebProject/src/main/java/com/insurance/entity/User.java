package com.insurance.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

/**
 * Core user entity representing customers, agents, claims officers, and admins.
 * <p>
 * Supports local authentication (email + password) as well as OAuth2 providers
 * such as Google. Multi-factor authentication can be toggled per user.
 *
 * @author Santhosh
 * @since 1.0
 */
@Entity
@Table(name = "users")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User extends BaseEntity {

    @NotBlank(message = "First name is required")
    @Size(max = 50, message = "First name must not exceed 50 characters")
    @Column(name = "first_name", nullable = false, length = 50)
    private String firstName;

    @NotBlank(message = "Last name is required")
    @Size(max = 50, message = "Last name must not exceed 50 characters")
    @Column(name = "last_name", nullable = false, length = 50)
    private String lastName;

    @NotBlank(message = "Email is required")
    @Email(message = "Email must be valid")
    @Column(name = "email", nullable = false, unique = true, length = 100)
    private String email;

    @Column(name = "password", length = 120)
    private String password;

    @Size(max = 15, message = "Phone number must not exceed 15 characters")
    @Column(name = "phone", length = 15)
    private String phone;

    @Column(name = "address")
    private String address;

    @Column(name = "city", length = 50)
    private String city;

    @Column(name = "state", length = 50)
    private String state;

    @Column(name = "zip_code", length = 10)
    private String zipCode;

    @Column(name = "customer_id", unique = true, length = 50)
    private String customerId;

    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;

    @Column(name = "gender", length = 10)
    private String gender;

    @Column(name = "profile_image_url")
    private String profileImageUrl;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "kyc_status", length = 20)
    private KycStatus kycStatus = KycStatus.PENDING;

    @Column(name = "kyc_verified_at")
    private LocalDateTime kycVerifiedAt;

    @Column(name = "aadhaar_number")
    private String aadhaarNumber; // Encrypted at rest

    /** Administrative account status – drives enabled/accountNonLocked flags. */
    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "account_status", length = 20)
    private AccountStatus accountStatus = AccountStatus.ACTIVE;

    @Column(name = "last_login_at")
    private LocalDateTime lastLoginAt;

    @Column(name = "license_number", length = 50)
    private String licenseNumber;

    @Column(name = "license_expiry_date")
    private LocalDate licenseExpiryDate;

    @Builder.Default
    @Column(name = "lifetime_commission", precision = 15, scale = 2)
    private BigDecimal lifetimeCommission = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "customer_count")
    private Integer customerCount = 0;

    @Enumerated(EnumType.STRING)
    @Column(name = "agent_tier", length = 30)
    private AgentTier agentTier;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_agent_id")
    private User parentAgent;

    @Builder.Default
    @Column(name = "email_verified", nullable = false)
    private boolean emailVerified = false;

    @Builder.Default
    @Column(name = "mfa_enabled", nullable = false)
    private boolean mfaEnabled = false;

    /** Base32-encoded TOTP secret generated at registration time. */
    @Column(name = "mfa_secret", length = 64)
    private String mfaSecret;

    /** Authentication provider – "local" or an OAuth2 provider name (e.g. "google") */
    @Builder.Default
    @Column(name = "provider", length = 20, nullable = false)
    private String provider = "local";

    /** Provider-specific user identifier (null for local accounts) */
    @Column(name = "provider_id")
    private String providerId;

    @Builder.Default
    @Column(name = "enabled", nullable = false)
    private boolean enabled = true;

    @Builder.Default
    @Column(name = "account_non_locked", nullable = false)
    private boolean accountNonLocked = true;

    /**
     * The set of roles assigned to this user.
     * Eagerly fetched because roles are a small, bounded set and
     * are needed on virtually every authenticated request for authorization checks.
     */
    @Builder.Default
    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
            name = "user_roles",
            joinColumns = @JoinColumn(name = "user_id"),
            inverseJoinColumns = @JoinColumn(name = "role_id")
    )
    private Set<Role> roles = new HashSet<>();

    @jakarta.persistence.PrePersist
    protected void onPrePersist() {
        if (this.customerId == null) {
            this.customerId = com.insurance.util.CustomerIdGenerator.generate();
        }
    }
}
