package com.clinicsaas.repositories.tenant;

import com.clinicsaas.entities.tenant.LabTest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface LabTestRepository extends JpaRepository<LabTest, UUID> {
}
