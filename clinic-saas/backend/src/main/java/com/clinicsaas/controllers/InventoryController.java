package com.clinicsaas.controllers;

import com.clinicsaas.dtos.request.CreateInventoryItemRequest;
import com.clinicsaas.dtos.request.InventoryTransactionRequest;
import com.clinicsaas.dtos.response.InventoryItemResponse;
import com.clinicsaas.dtos.response.InventoryTransactionResponse;
import com.clinicsaas.entities.enums.InventoryCategory;
import com.clinicsaas.security.AppUserPrincipal;
import com.clinicsaas.services.InventoryService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/inventory")
@RequiredArgsConstructor
@Tag(name = "Inventory")
@SecurityRequirement(name = "bearerAuth")
public class InventoryController {

    private final InventoryService inventoryService;

    @GetMapping
    @PreAuthorize("hasAuthority('SETTINGS_READ')")
    public ResponseEntity<List<InventoryItemResponse>> listAll(
            @RequestParam(required = false) InventoryCategory category) {
        return ResponseEntity.ok(inventoryService.listAll(category));
    }

    @GetMapping("/low-stock")
    @PreAuthorize("hasAuthority('SETTINGS_READ')")
    public ResponseEntity<List<InventoryItemResponse>> listLowStock() {
        return ResponseEntity.ok(inventoryService.listLowStock());
    }

    @PostMapping
    @PreAuthorize("hasAuthority('SETTINGS_WRITE')")
    public ResponseEntity<InventoryItemResponse> create(@Valid @RequestBody CreateInventoryItemRequest req) {
        return ResponseEntity.status(201).body(inventoryService.create(req));
    }

    @PostMapping("/{id}/transaction")
    @PreAuthorize("hasAuthority('SETTINGS_WRITE')")
    public ResponseEntity<InventoryTransactionResponse> addTransaction(
            @PathVariable UUID id,
            @Valid @RequestBody InventoryTransactionRequest req,
            @AuthenticationPrincipal AppUserPrincipal principal) {
        return ResponseEntity.status(201).body(inventoryService.addTransaction(id, req, principal.getId()));
    }

    @GetMapping("/{id}/transactions")
    @PreAuthorize("hasAuthority('SETTINGS_READ')")
    public ResponseEntity<List<InventoryTransactionResponse>> getTransactions(@PathVariable UUID id) {
        return ResponseEntity.ok(inventoryService.getTransactions(id));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('SETTINGS_WRITE')")
    public ResponseEntity<Void> deactivate(@PathVariable UUID id) {
        inventoryService.deactivate(id);
        return ResponseEntity.noContent().build();
    }
}
