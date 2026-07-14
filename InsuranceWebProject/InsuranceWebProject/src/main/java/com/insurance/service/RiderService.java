package com.insurance.service;

import com.insurance.dto.admin.RiderRequest;
import com.insurance.dto.policy.RiderResponse;
import com.insurance.entity.Rider;
import com.insurance.exception.BadRequestException;
import com.insurance.exception.ResourceNotFoundException;
import com.insurance.repository.RiderRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Service managing {@link Rider} entities — both admin CRUD and customer-facing reads.
 *
 * @author Santhosh
 * @since 2.0
 */
@Service
public class RiderService {

    private final RiderRepository riderRepository;

    public RiderService(RiderRepository riderRepository) {
        this.riderRepository = riderRepository;
    }

    /** Returns all active riders — used by the purchase/quote UI. */
    public List<RiderResponse> getActiveRiders() {
        return riderRepository.findByActiveTrue().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    /** Returns all riders (active + inactive) — used by the admin panel. */
    public List<RiderResponse> getAllRiders() {
        return riderRepository.findAll().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public RiderResponse createRider(RiderRequest request) {
        riderRepository.findByRiderCode(request.getRiderCode()).ifPresent(r -> {
            throw new BadRequestException("Rider code '" + request.getRiderCode() + "' already exists.");
        });

        Rider rider = Rider.builder()
                .riderCode(request.getRiderCode())
                .name(request.getName())
                .description(request.getDescription())
                .ratePercent(request.getRatePercent())
                .active(request.isActive())
                .build();

        return toResponse(riderRepository.save(rider));
    }

    @Transactional
    public RiderResponse updateRider(UUID id, RiderRequest request) {
        Rider rider = riderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Rider not found: " + id));

        rider.setName(request.getName());
        rider.setDescription(request.getDescription());
        rider.setRatePercent(request.getRatePercent());
        rider.setActive(request.isActive());

        return toResponse(riderRepository.save(rider));
    }

    @Transactional
    public void toggleActive(UUID id) {
        Rider rider = riderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Rider not found: " + id));
        rider.setActive(!rider.isActive());
        riderRepository.save(rider);
    }

    // ── Mapper ───────────────────────────────────────────────────────────────

    public RiderResponse toResponse(Rider r) {
        return RiderResponse.builder()
                .id(r.getId())
                .riderCode(r.getRiderCode())
                .name(r.getName())
                .description(r.getDescription())
                .ratePercent(r.getRatePercent())
                .active(r.isActive())
                .build();
    }
}
