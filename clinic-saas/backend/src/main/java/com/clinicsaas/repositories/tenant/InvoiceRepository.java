package com.clinicsaas.repositories.tenant;

import com.clinicsaas.entities.tenant.Invoice;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface InvoiceRepository extends JpaRepository<Invoice, UUID> {
    Page<Invoice> findByPatientIdOrderByCreatedAtDesc(UUID patientId, Pageable pageable);
}
