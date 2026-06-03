package com.clinicsaas.pii;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

public interface AuditLogRepository extends JpaRepository<AuditLog, UUID> {

    Page<AuditLog> findByPatientIdOrderByCreatedAtDesc(UUID patientId, Pageable pageable);

    Page<AuditLog> findByUserIdOrderByCreatedAtDesc(UUID userId, Pageable pageable);

    @Transactional("tenantTransactionManager")
    @Override
    <S extends AuditLog> S save(S entity);
}
