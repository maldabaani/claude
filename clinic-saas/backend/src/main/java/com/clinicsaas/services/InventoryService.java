package com.clinicsaas.services;

import com.clinicsaas.dtos.request.CreateInventoryItemRequest;
import com.clinicsaas.dtos.request.InventoryTransactionRequest;
import com.clinicsaas.dtos.response.InventoryItemResponse;
import com.clinicsaas.dtos.response.InventoryTransactionResponse;
import com.clinicsaas.entities.enums.InventoryCategory;
import com.clinicsaas.entities.enums.InventoryTransactionType;
import com.clinicsaas.entities.tenant.InventoryItem;
import com.clinicsaas.entities.tenant.InventoryTransaction;
import com.clinicsaas.exceptions.BadRequestException;
import com.clinicsaas.exceptions.ResourceNotFoundException;
import com.clinicsaas.repositories.tenant.InventoryItemRepository;
import com.clinicsaas.repositories.tenant.InventoryTransactionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class InventoryService {

    private final InventoryItemRepository inventoryItemRepository;
    private final InventoryTransactionRepository inventoryTransactionRepository;

    @Transactional(value = "tenantTransactionManager", readOnly = true)
    public List<InventoryItemResponse> listAll(InventoryCategory categoryFilter) {
        log.debug("Listing inventory items, categoryFilter={}", categoryFilter);
        List<InventoryItem> items;
        if (categoryFilter == null) {
            items = inventoryItemRepository.findByActiveTrueOrderByNameAsc();
        } else {
            items = inventoryItemRepository.findByCategoryAndActiveTrueOrderByNameAsc(categoryFilter);
        }
        return items.stream().map(InventoryItemResponse::from).collect(Collectors.toList());
    }

    @Transactional(value = "tenantTransactionManager", readOnly = true)
    public List<InventoryItemResponse> listLowStock() {
        log.debug("Listing low-stock inventory items");
        // We fetch all active items and filter those where currentStock <= minimumStock
        return inventoryItemRepository.findByActiveTrueOrderByNameAsc()
                .stream()
                .filter(i -> i.getCurrentStock() <= i.getMinimumStock())
                .map(InventoryItemResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional("tenantTransactionManager")
    public InventoryItemResponse create(CreateInventoryItemRequest req) {
        log.debug("Creating inventory item: {}", req.name());
        InventoryItem item = InventoryItem.builder()
                .name(req.name())
                .category(req.category() != null ? req.category() : InventoryCategory.MEDICATION)
                .sku(req.sku())
                .unit(req.unit() != null ? req.unit() : "units")
                .minimumStock(req.minimumStock())
                .unitCost(req.unitCost())
                .supplier(req.supplier())
                .notes(req.notes())
                .build();
        InventoryItem saved = inventoryItemRepository.save(item);
        log.debug("Created inventory item {}", saved.getId());
        return InventoryItemResponse.from(saved);
    }

    @Transactional("tenantTransactionManager")
    public InventoryTransactionResponse addTransaction(UUID itemId, InventoryTransactionRequest req, UUID performedBy) {
        log.debug("Adding transaction for item {}, type={}, qty={}", itemId, req.transactionType(), req.quantity());
        InventoryItem item = inventoryItemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("InventoryItem", itemId));

        InventoryTransactionType type = req.transactionType();
        int qty = req.quantity();

        if (type == InventoryTransactionType.IN || type == InventoryTransactionType.ADJUSTMENT) {
            item.setCurrentStock(item.getCurrentStock() + qty);
        } else {
            // OUT, EXPIRED, TRANSFER
            if (item.getCurrentStock() < qty) {
                throw new BadRequestException("Insufficient stock. Available: " + item.getCurrentStock() + ", requested: " + qty);
            }
            item.setCurrentStock(item.getCurrentStock() - qty);
        }
        inventoryItemRepository.save(item);

        InventoryTransaction tx = InventoryTransaction.builder()
                .item(item)
                .transactionType(type)
                .quantity(qty)
                .notes(req.notes())
                .performedBy(performedBy)
                .referenceId(req.referenceId())
                .build();
        InventoryTransaction saved = inventoryTransactionRepository.save(tx);
        log.debug("Created inventory transaction {}", saved.getId());
        return InventoryTransactionResponse.from(saved);
    }

    @Transactional(value = "tenantTransactionManager", readOnly = true)
    public InventoryItemResponse getItem(UUID id) {
        log.debug("Fetching inventory item {}", id);
        InventoryItem item = inventoryItemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("InventoryItem", id));
        return InventoryItemResponse.from(item);
    }

    @Transactional(value = "tenantTransactionManager", readOnly = true)
    public List<InventoryTransactionResponse> getTransactions(UUID itemId) {
        log.debug("Fetching transactions for item {}", itemId);
        return inventoryTransactionRepository.findByItemIdOrderByCreatedAtDesc(itemId)
                .stream().map(InventoryTransactionResponse::from).collect(Collectors.toList());
    }

    @Transactional("tenantTransactionManager")
    public void deactivate(UUID id) {
        log.debug("Deactivating inventory item {}", id);
        InventoryItem item = inventoryItemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("InventoryItem", id));
        item.setActive(false);
        inventoryItemRepository.save(item);
        log.debug("Deactivated inventory item {}", id);
    }
}
