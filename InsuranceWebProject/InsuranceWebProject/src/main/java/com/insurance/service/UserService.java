package com.insurance.service;

import com.insurance.dto.user.ChangePasswordRequest;
import com.insurance.dto.user.UserNomineeDto;
import com.insurance.dto.user.UserProfileUpdateRequest;
import com.insurance.dto.user.UserResponse;
import com.insurance.entity.User;
import com.insurance.entity.UserNominee;
import com.insurance.exception.BadRequestException;
import com.insurance.exception.ResourceNotFoundException;
import com.insurance.repository.UserNomineeRepository;
import com.insurance.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final UserNomineeRepository userNomineeRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthService authService;
    private final com.insurance.repository.CustomerPolicyRepository customerPolicyRepository;

    public UserService(UserRepository userRepository, UserNomineeRepository userNomineeRepository, 
                       PasswordEncoder passwordEncoder, AuthService authService,
                       com.insurance.repository.CustomerPolicyRepository customerPolicyRepository) {
        this.userRepository = userRepository;
        this.userNomineeRepository = userNomineeRepository;
        this.passwordEncoder = passwordEncoder;
        this.authService = authService;
        this.customerPolicyRepository = customerPolicyRepository;
    }

    public UserResponse getUserProfile(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return authService.mapToUserResponse(user);
    }

    public List<UserNomineeDto> getUserNominees(UUID userId) {
        return userNomineeRepository.findByUserId(userId).stream()
                .map(this::mapToNomineeDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public UserResponse updateProfile(UUID userId, UserProfileUpdateRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (request.getFirstName() != null) user.setFirstName(request.getFirstName());
        if (request.getLastName() != null) user.setLastName(request.getLastName());
        if (request.getPhone() != null) user.setPhone(request.getPhone());
        if (request.getAddress() != null) user.setAddress(request.getAddress());
        if (request.getCity() != null) user.setCity(request.getCity());
        if (request.getState() != null) user.setState(request.getState());
        if (request.getZipCode() != null) user.setZipCode(request.getZipCode());
        if (request.getDateOfBirth() != null) user.setDateOfBirth(request.getDateOfBirth());
        if (request.getGender() != null) user.setGender(request.getGender());
        if (request.getProfileImageUrl() != null) user.setProfileImageUrl(request.getProfileImageUrl());
        if (request.getAadhaarNumber() != null) {
            user.setAadhaarNumber(com.insurance.util.EncryptionUtil.encrypt(request.getAadhaarNumber()));
        }

        userRepository.save(user);

        // Propagate address/contact updates across all policies owned by the user
        boolean hasContactUpdates = request.getAddress() != null || request.getPhone() != null;
        if (hasContactUpdates) {
            List<com.insurance.entity.CustomerPolicy> policies = customerPolicyRepository.findByUserId(userId);
            for (com.insurance.entity.CustomerPolicy cp : policies) {
                if (cp.getUnderwritingDetails() != null) {
                    try {
                        java.util.Map<String, Object> details = new com.fasterxml.jackson.databind.ObjectMapper()
                                .readValue(cp.getUnderwritingDetails(), java.util.Map.class);
                        if (request.getAddress() != null) {
                            details.put("address", request.getAddress());
                        }
                        if (request.getPhone() != null) {
                            details.put("proposerPhone", request.getPhone());
                        }
                        cp.setUnderwritingDetails(new com.fasterxml.jackson.databind.ObjectMapper()
                                .writeValueAsString(details));
                        customerPolicyRepository.save(cp);
                    } catch (Exception e) {
                        // ignore/log
                    }
                }
            }
        }

        // Handle nominees for CUSTOMER role
        if (request.getNominees() != null) {
            // Delete existing nominees
            userNomineeRepository.deleteAll(userNomineeRepository.findByUserId(userId));

            // Save new nominees
            for (UserNomineeDto dto : request.getNominees()) {
                UserNominee nominee = UserNominee.builder()
                        .user(user)
                        .name(dto.getName())
                        .relationship(dto.getRelationship())
                        .contactNumber(dto.getContactNumber())
                        .sharePercentage(dto.getSharePercentage())
                        .build();
                userNomineeRepository.save(nominee);
            }
        }

        return authService.mapToUserResponse(user);
    }

    @Transactional
    public void changePassword(UUID userId, ChangePasswordRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new BadRequestException("Current password is incorrect");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    public String uploadProfileImage(UUID userId, MultipartFile file) {
        if (file.isEmpty()) {
            throw new BadRequestException("Please select a file to upload");
        }

        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new BadRequestException("Only image files are allowed");
        }

        try {
            Path uploadPath = Paths.get("./uploads/profile-pics");
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            String originalFilename = file.getOriginalFilename();
            String extension = "";
            if (originalFilename != null && originalFilename.contains(".")) {
                extension = originalFilename.substring(originalFilename.lastIndexOf("."));
            }
            String filename = userId.toString() + "_" + System.currentTimeMillis() + extension;

            Path filePath = uploadPath.resolve(filename);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            return "/api/uploads/profile-pics/" + filename;
        } catch (IOException e) {
            throw new RuntimeException("Could not store file. Error: " + e.getMessage(), e);
        }
    }

    private UserNomineeDto mapToNomineeDto(UserNominee nominee) {
        UserNomineeDto dto = new UserNomineeDto();
        dto.setId(nominee.getId());
        dto.setName(nominee.getName());
        dto.setRelationship(nominee.getRelationship());
        dto.setContactNumber(nominee.getContactNumber());
        dto.setSharePercentage(nominee.getSharePercentage());
        return dto;
    }
}
