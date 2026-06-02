package com.clinicsaas.repositories.tenant;

import com.clinicsaas.entities.tenant.Diagnosis;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface DiagnosisRepository extends JpaRepository<Diagnosis, UUID> {
    List<Diagnosis> findByVisitIdOrderByCreatedAtAsc(UUID visitId);
}
