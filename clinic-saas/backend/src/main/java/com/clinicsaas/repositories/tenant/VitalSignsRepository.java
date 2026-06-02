package com.clinicsaas.repositories.tenant;

import com.clinicsaas.entities.tenant.VitalSigns;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface VitalSignsRepository extends JpaRepository<VitalSigns, UUID> {
    Optional<VitalSigns> findFirstByVisit_IdOrderByCreatedAtDesc(UUID visitId);
    List<VitalSigns> findByVisit_Patient_IdOrderByCreatedAtAsc(UUID patientId);
    Optional<VitalSigns> findFirstByVisit_IdOrderByCreatedAtAsc(UUID visitId);
}
