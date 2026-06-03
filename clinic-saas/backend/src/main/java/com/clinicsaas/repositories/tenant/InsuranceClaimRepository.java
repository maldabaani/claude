package com.clinicsaas.repositories.tenant;

import com.clinicsaas.entities.enums.InsuranceClaimStatus;
import com.clinicsaas.entities.tenant.InsuranceClaim;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface InsuranceClaimRepository extends JpaRepository<InsuranceClaim, UUID> {
    Optional<InsuranceClaim> findByInvoice_Id(UUID invoiceId);
    List<InsuranceClaim> findAllByOrderByCreatedAtDesc();
    List<InsuranceClaim> findByStatusOrderByCreatedAtDesc(InsuranceClaimStatus status);
}
