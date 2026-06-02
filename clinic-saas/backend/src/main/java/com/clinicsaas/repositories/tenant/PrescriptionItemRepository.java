package com.clinicsaas.repositories.tenant;

import com.clinicsaas.entities.tenant.PrescriptionItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface PrescriptionItemRepository extends JpaRepository<PrescriptionItem, UUID> {
    List<PrescriptionItem> findByPrescription_Id(UUID prescriptionId);
}
