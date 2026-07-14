package com.insurance.dto.user;

import lombok.Data;
import java.time.LocalDate;
import java.util.List;

@Data
public class UserProfileUpdateRequest {
    private String firstName;
    private String lastName;
    private String phone;
    private String address;
    private String city;
    private String state;
    private String zipCode;
    private LocalDate dateOfBirth;
    private String gender;
    private String profileImageUrl;
    private String aadhaarNumber;
    private List<UserNomineeDto> nominees;
}
