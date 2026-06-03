package com.clinicsaas.repositories.tenant;

import com.clinicsaas.entities.tenant.InsurancePayer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface InsurancePayerRepository extends JpaRepository<InsurancePayer, UUID> {
    List<InsurancePayer> findByActiveTrueOrderByNameAsc();
}
