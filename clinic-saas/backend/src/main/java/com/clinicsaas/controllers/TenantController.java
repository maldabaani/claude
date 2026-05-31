package com.clinicsaas.controllers;

import com.clinicsaas.dtos.request.CreateTenantRequest;
import com.clinicsaas.dtos.response.TenantResponse;
import com.clinicsaas.services.TenantService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/platform/tenants")
@PreAuthorize("hasRole('PLATFORM_ADMIN')")
@RequiredArgsConstructor
@Tag(name = "Platform - Tenant Management")
public class TenantController {

    private final TenantService tenantService;

    @PostMapping
    @Operation(summary = "Provision a new clinic tenant")
    public ResponseEntity<TenantResponse> create(@Valid @RequestBody CreateTenantRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(tenantService.provision(req));
    }

    @GetMapping
    @Operation(summary = "List all tenants")
    public ResponseEntity<List<TenantResponse>> list() {
        return ResponseEntity.ok(tenantService.listAll());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get tenant by ID")
    public ResponseEntity<TenantResponse> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(tenantService.getById(id));
    }
}
