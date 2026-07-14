package com.insurance.service;

import com.insurance.dto.admin.PremiumRateConfigRequest;
import com.insurance.dto.admin.PremiumRateConfigResponse;
import com.insurance.entity.PremiumRateConfig;
import com.insurance.exception.BadRequestException;
import com.insurance.exception.ResourceNotFoundException;
import com.insurance.repository.PremiumRateConfigRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Admin-facing CRUD service for {@link PremiumRateConfig} rows.
 *
 * <p>Allows admins to update premium multipliers (e.g. the SMOKER loading or
 * an age-band factor) without modifying code or redeploying the application.
 *
 * @author Santhosh
 * @since 2.0
 */
@Service
public class PremiumRateConfigService {

    private final PremiumRateConfigRepository rateConfigRepository;

    public PremiumRateConfigService(PremiumRateConfigRepository rateConfigRepository) {
        this.rateConfigRepository = rateConfigRepository;
    }

    public List<PremiumRateConfigResponse> getAllConfigs() {
        return rateConfigRepository.findAll().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public List<PremiumRateConfigResponse> getConfigsByType(String policyTypeName) {
        return rateConfigRepository.findByPolicyTypeName(policyTypeName).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public PremiumRateConfigResponse createConfig(PremiumRateConfigRequest request) {
        // Prevent duplicate (policyTypeName, factorKey) combinations
        rateConfigRepository.findByPolicyTypeNameAndFactorKey(request.getPolicyTypeName(), request.getFactorKey())
                .ifPresent(existing -> {
                    throw new BadRequestException(
                            "A rate config already exists for type='" + request.getPolicyTypeName() +
                            "' and key='" + request.getFactorKey() + "'. Use the update endpoint instead.");
                });

        PremiumRateConfig config = PremiumRateConfig.builder()
                .policyTypeName(request.getPolicyTypeName())
                .factorKey(request.getFactorKey())
                .factorValue(request.getFactorValue())
                .description(request.getDescription())
                .active(request.isActive())
                .build();

        return toResponse(rateConfigRepository.save(config));
    }

    @Transactional
    public PremiumRateConfigResponse updateConfig(UUID id, PremiumRateConfigRequest request) {
        PremiumRateConfig config = rateConfigRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Rate config not found: " + id));

        config.setFactorValue(request.getFactorValue());
        config.setDescription(request.getDescription());
        config.setActive(request.isActive());

        return toResponse(rateConfigRepository.save(config));
    }

    @Transactional
    public void toggleActive(UUID id) {
        PremiumRateConfig config = rateConfigRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Rate config not found: " + id));
        config.setActive(!config.isActive());
        rateConfigRepository.save(config);
    }

    // ── Mapper ───────────────────────────────────────────────────────────────

    private PremiumRateConfigResponse toResponse(PremiumRateConfig c) {
        return PremiumRateConfigResponse.builder()
                .id(c.getId())
                .policyTypeName(c.getPolicyTypeName())
                .factorKey(c.getFactorKey())
                .factorValue(c.getFactorValue())
                .description(c.getDescription())
                .active(c.isActive())
                .createdAt(c.getCreatedAt())
                .updatedAt(c.getUpdatedAt())
                .build();
    }
}
