package com.clinicsaas.repositories.tenant;

import com.clinicsaas.entities.tenant.PatientDocument;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface PatientDocumentRepository extends JpaRepository<PatientDocument, UUID> {
    List<PatientDocument> findByPatientIdOrderByCreatedAtDesc(UUID patientId);
}
