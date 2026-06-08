package com.clinicsaas.dtos.response;

import com.clinicsaas.entities.enums.InventoryTransactionType;
import com.clinicsaas.entities.tenant.InventoryTransaction;

import java.time.LocalDateTime;
import java.util.UUID;

public record InventoryTransactionResponse(
        UUID id,
        UUID itemId,
        String itemName,
        InventoryTransactionType transactionType,
        int quantity,
        String notes,
        UUID performedBy,
        UUID referenceId,
        LocalDateTime createdAt
) {
    public static InventoryTransactionResponse from(InventoryTransaction tx) {
        return new InventoryTransactionResponse(
                tx.getId(),
                tx.getItemId(),
                tx.getItem() != null ? tx.getItem().getName() : null,
                tx.getTransactionType(),
                tx.getQuantity(),
                tx.getNotes(),
                tx.getPerformedBy(),
                tx.getReferenceId(),
                tx.getCreatedAt()
        );
    }
}
