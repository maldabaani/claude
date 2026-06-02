package com.clinicsaas.repositories.tenant;

import com.clinicsaas.entities.tenant.RadiologyOrder;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface RadiologyOrderRepository extends JpaRepository<RadiologyOrder, UUID> {
    List<RadiologyOrder> findByVisit_IdOrderByCreatedAtDesc(UUID visitId);
    List<RadiologyOrder> findByPatientIdOrderByCreatedAtDesc(UUID patientId);
}
