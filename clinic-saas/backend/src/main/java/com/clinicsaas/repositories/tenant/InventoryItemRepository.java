package com.clinicsaas.repositories.tenant;

import com.clinicsaas.entities.enums.InventoryCategory;
import com.clinicsaas.entities.tenant.InventoryItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface InventoryItemRepository extends JpaRepository<InventoryItem, UUID> {
    List<InventoryItem> findByActiveTrueOrderByNameAsc();
    List<InventoryItem> findByCurrentStockLessThanEqualAndActiveTrueOrderByCurrentStockAsc(int threshold);
    List<InventoryItem> findByCategoryAndActiveTrueOrderByNameAsc(InventoryCategory category);
}
