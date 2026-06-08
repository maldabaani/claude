package com.clinicsaas.entities.tenant;

import com.clinicsaas.entities.enums.InventoryTransactionType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "inventory_transactions")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class InventoryTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "item_id", nullable = false)
    private InventoryItem item;

    @Column(name = "item_id", insertable = false, updatable = false)
    private UUID itemId;

    @Enumerated(EnumType.STRING)
    @Column(name = "transaction_type", nullable = false, length = 20)
    private InventoryTransactionType transactionType;

    @Column(nullable = false)
    private int quantity;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "performed_by")
    private UUID performedBy;

    @Column(name = "reference_id")
    private UUID referenceId;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
