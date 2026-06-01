package com.clinicsaas.repositories.tenant;

import com.clinicsaas.entities.tenant.InvoiceItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface InvoiceItemRepository extends JpaRepository<InvoiceItem, UUID> {
    List<InvoiceItem> findByInvoice_Id(UUID invoiceId);
}
