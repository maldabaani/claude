package com.clinicsaas.repositories.tenant;

import com.clinicsaas.entities.tenant.Patient;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface PatientRepository extends JpaRepository<Patient, UUID> {
    Optional<Patient> findByMedicalRecordNumber(String mrn);
    boolean existsByMedicalRecordNumber(String mrn);

    @Query("SELECT p FROM Patient p WHERE p.active = true AND " +
           "(LOWER(p.firstName) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
           " LOWER(p.lastName)  LIKE LOWER(CONCAT('%', :q, '%')) OR " +
           " p.medicalRecordNumber LIKE CONCAT('%', :q, '%'))")
    Page<Patient> search(@Param("q") String query, Pageable pageable);
}
