package com.insurance.dto.user;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class UserResponse {
    private UUID id;
    private String customerId;
    private String firstName;
    private String lastName;
    private String email;
    private String phone;
    private String address;
    private String city;
    private String state;
    private String zipCode;
    private LocalDate dateOfBirth;
    private String gender;
    private String profileImageUrl;
    private String kycStatus;
    private LocalDateTime kycVerifiedAt;
    private String aadhaarNumberMasked;
    private String accountStatus;
    private LocalDateTime lastLoginAt;
    private String licenseNumber;
    private LocalDate licenseExpiryDate;
    private BigDecimal lifetimeCommission;
    private Integer customerCount;
    private boolean emailVerified;
    private boolean mfaEnabled;
    private boolean enabled;
    private List<String> roles;
}

