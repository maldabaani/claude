package com.clinicsaas.dtos.response;

import com.clinicsaas.entities.enums.InventoryCategory;
import com.clinicsaas.entities.tenant.InventoryItem;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public record InventoryItemResponse(
        UUID id,
        String name,
        InventoryCategory category,
        String sku,
        String unit,
        int currentStock,
        int minimumStock,
        boolean lowStock,
        BigDecimal unitCost,
        String supplier,
        String notes,
        boolean active,
        LocalDateTime createdAt
) {
    public static InventoryItemResponse from(InventoryItem item) {
        return new InventoryItemResponse(
                item.getId(),
                item.getName(),
                item.getCategory(),
                item.getSku(),
                item.getUnit(),
                item.getCurrentStock(),
                item.getMinimumStock(),
                item.getCurrentStock() <= item.getMinimumStock(),
                item.getUnitCost(),
                item.getSupplier(),
                item.getNotes(),
                item.isActive(),
                item.getCreatedAt()
        );
    }
}
