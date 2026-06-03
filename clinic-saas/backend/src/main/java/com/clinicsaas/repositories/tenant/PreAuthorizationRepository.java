package com.clinicsaas.repositories.tenant;

import com.clinicsaas.entities.enums.PreAuthorizationStatus;
import com.clinicsaas.entities.tenant.PreAuthorization;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface PreAuthorizationRepository extends JpaRepository<PreAuthorization, UUID> {
    List<PreAuthorization> findByPatientIdOrderByCreatedAtDesc(UUID patientId);
    List<PreAuthorization> findByStatusOrderByCreatedAtDesc(PreAuthorizationStatus status);
}
