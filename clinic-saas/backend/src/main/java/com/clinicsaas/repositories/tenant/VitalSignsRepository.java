package com.clinicsaas.repositories.tenant;

import com.clinicsaas.entities.tenant.VitalSigns;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface VitalSignsRepository extends JpaRepository<VitalSigns, UUID> {
    Optional<VitalSigns> findFirstByVisit_IdOrderByCreatedAtDesc(UUID visitId);
}
