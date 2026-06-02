package com.clinicsaas.repositories.tenant;

import com.clinicsaas.entities.enums.VisitStatus;
import com.clinicsaas.entities.tenant.Visit;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface VisitRepository extends JpaRepository<Visit, UUID> {

    @Query("SELECT v FROM Visit v WHERE v.patient.id = :patientId ORDER BY v.createdAt DESC")
    Page<Visit> findByPatientIdOrderByCreatedAtDesc(@Param("patientId") UUID patientId, Pageable pageable);

    long countByStatus(VisitStatus status);

    @Query("SELECT v FROM Visit v WHERE v.status IN :statuses ORDER BY v.checkedInAt ASC NULLS LAST")
    List<Visit> findActiveQueue(@Param("statuses") List<VisitStatus> statuses);
}
