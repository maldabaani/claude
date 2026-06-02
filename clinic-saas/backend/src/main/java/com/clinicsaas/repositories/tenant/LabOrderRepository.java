package com.clinicsaas.repositories.tenant;

import com.clinicsaas.entities.tenant.LabOrder;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface LabOrderRepository extends JpaRepository<LabOrder, UUID> {
    List<LabOrder> findByVisit_IdOrderByCreatedAtDesc(UUID visitId);
    List<LabOrder> findByPatientIdOrderByCreatedAtDesc(UUID patientId);
    List<LabOrder> findAllByOrderByCreatedAtDesc();
}
