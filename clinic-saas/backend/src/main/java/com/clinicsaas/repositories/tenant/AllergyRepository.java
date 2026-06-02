package com.clinicsaas.repositories.tenant;

import com.clinicsaas.entities.tenant.Allergy;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface AllergyRepository extends JpaRepository<Allergy, UUID> {
    List<Allergy> findByPatient_IdAndActiveTrue(UUID patientId);
}
