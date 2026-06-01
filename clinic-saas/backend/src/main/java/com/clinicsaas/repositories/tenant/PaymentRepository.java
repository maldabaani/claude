package com.clinicsaas.repositories.tenant;

import com.clinicsaas.entities.tenant.Payment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface PaymentRepository extends JpaRepository<Payment, UUID> {
    List<Payment> findByInvoice_Id(UUID invoiceId);
}
