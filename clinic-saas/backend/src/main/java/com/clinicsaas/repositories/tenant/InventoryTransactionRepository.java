package com.clinicsaas.repositories.tenant;

import com.clinicsaas.entities.tenant.InventoryTransaction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface InventoryTransactionRepository extends JpaRepository<InventoryTransaction, UUID> {
    List<InventoryTransaction> findByItemIdOrderByCreatedAtDesc(UUID itemId);
}
