package com.insurance.repository;

import com.insurance.entity.Rider;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface RiderRepository extends JpaRepository<Rider, UUID> {

    List<Rider> findByActiveTrue();

    Optional<Rider> findByRiderCode(String riderCode);

    List<Rider> findByIdIn(List<UUID> ids);
}
