package com.clinicsaas.repositories.tenant;

import com.clinicsaas.entities.tenant.Visit;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface VisitRepository extends JpaRepository<Visit, UUID> {
    Page<Visit> findByPatientIdOrderByCreatedAtDesc(UUID patientId, Pageable pageable);
    long countByStatus(String status);
}
