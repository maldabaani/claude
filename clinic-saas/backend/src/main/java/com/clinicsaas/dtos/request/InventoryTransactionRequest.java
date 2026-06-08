package com.clinicsaas.dtos.request;

import com.clinicsaas.entities.enums.InventoryTransactionType;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record InventoryTransactionRequest(
        @NotNull InventoryTransactionType transactionType,
        @NotNull @Min(1) int quantity,
        String notes,
        UUID referenceId
) {}
