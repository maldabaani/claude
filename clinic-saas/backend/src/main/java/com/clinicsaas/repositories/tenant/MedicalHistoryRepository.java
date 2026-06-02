package com.clinicsaas.repositories.tenant;

import com.clinicsaas.entities.tenant.MedicalHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface MedicalHistoryRepository extends JpaRepository<MedicalHistory, UUID> {
    List<MedicalHistory> findByPatient_IdOrderByOnsetDateDesc(UUID patientId);
}
