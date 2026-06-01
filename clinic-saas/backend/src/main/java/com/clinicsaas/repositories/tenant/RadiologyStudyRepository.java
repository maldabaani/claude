package com.clinicsaas.repositories.tenant;

import com.clinicsaas.entities.tenant.RadiologyStudy;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface RadiologyStudyRepository extends JpaRepository<RadiologyStudy, UUID> {
    Optional<RadiologyStudy> findByRadiologyOrder_Id(UUID orderId);
}
