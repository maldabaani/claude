package com.clinicsaas.entities.tenant;

import com.clinicsaas.entities.BaseEntity;
import com.clinicsaas.entities.enums.InventoryCategory;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "inventory_items")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class InventoryItem extends BaseEntity {

    @Column(nullable = false, length = 200)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    @Builder.Default
    private InventoryCategory category = InventoryCategory.MEDICATION;

    @Column(length = 100, unique = true)
    private String sku;

    @Column(nullable = false, length = 50)
    @Builder.Default
    private String unit = "units";

    @Column(name = "current_stock", nullable = false)
    @Builder.Default
    private int currentStock = 0;

    @Column(name = "minimum_stock", nullable = false)
    @Builder.Default
    private int minimumStock = 0;

    @Column(name = "unit_cost", precision = 10, scale = 2)
    private BigDecimal unitCost;

    @Column(length = 200)
    private String supplier;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(nullable = false)
    @Builder.Default
    private boolean active = true;
}
