package com.clinicsaas.repositories.tenant;

import com.clinicsaas.entities.tenant.RadiologyReport;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface RadiologyReportRepository extends JpaRepository<RadiologyReport, UUID> {
    Optional<RadiologyReport> findByRadiologyStudy_Id(UUID studyId);
}
