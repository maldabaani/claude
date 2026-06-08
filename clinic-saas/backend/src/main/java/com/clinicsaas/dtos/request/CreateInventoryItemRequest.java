package com.clinicsaas.dtos.request;

import com.clinicsaas.entities.enums.InventoryCategory;
import jakarta.validation.constraints.NotBlank;

import java.math.BigDecimal;

public record CreateInventoryItemRequest(
        @NotBlank String name,
        InventoryCategory category,
        String sku,
        String unit,
        int minimumStock,
        BigDecimal unitCost,
        String supplier,
        String notes
) {}
