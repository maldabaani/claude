package com.clinicsaas.repositories.tenant;

import com.clinicsaas.entities.tenant.Prescription;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface PrescriptionRepository extends JpaRepository<Prescription, UUID> {
    List<Prescription> findByPatientIdOrderByCreatedAtDesc(UUID patientId);
    List<Prescription> findByVisit_Id(UUID visitId);
    List<Prescription> findAllByOrderByCreatedAtDesc();
}
