package com.clinicsaas.repositories.tenant;

import com.clinicsaas.entities.tenant.LabOrderItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface LabOrderItemRepository extends JpaRepository<LabOrderItem, UUID> {
    List<LabOrderItem> findByLabOrder_Id(UUID labOrderId);
}
