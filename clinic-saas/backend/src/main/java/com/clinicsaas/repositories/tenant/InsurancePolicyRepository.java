package com.clinicsaas.repositories.tenant;

import com.clinicsaas.entities.tenant.InsurancePolicy;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface InsurancePolicyRepository extends JpaRepository<InsurancePolicy, UUID> {
    List<InsurancePolicy> findByPatient_IdOrderByCreatedAtDesc(UUID patientId);
    List<InsurancePolicy> findByPatient_IdAndActiveTrueOrderByCreatedAtDesc(UUID patientId);
    Optional<InsurancePolicy> findFirstByPatient_IdAndActiveTrueOrderByCreatedAtDesc(UUID patientId);
}
