package com.clinicsaas.controllers;

import com.clinicsaas.dtos.request.ProcessClaimRequest;
import com.clinicsaas.dtos.response.InsuranceClaimResponse;
import com.clinicsaas.services.InsuranceClaimService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/insurance/claims")
@RequiredArgsConstructor
@Tag(name = "Insurance")
@SecurityRequirement(name = "bearerAuth")
public class InsuranceClaimController {

    private final InsuranceClaimService insuranceClaimService;

    public record CreateClaimForInvoiceRequest(@NotNull UUID insurancePolicyId) {}

    @PostMapping("/invoice/{invoiceId}")
    @PreAuthorize("hasAuthority('BILLING_WRITE')")
    public ResponseEntity<InsuranceClaimResponse> createForInvoice(
            @PathVariable UUID invoiceId,
            @Valid @RequestBody CreateClaimForInvoiceRequest body) {
        return ResponseEntity.status(201)
                .body(insuranceClaimService.createForInvoice(invoiceId, body.insurancePolicyId()));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('BILLING_READ')")
    public ResponseEntity<InsuranceClaimResponse> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(insuranceClaimService.getById(id));
    }

    @GetMapping
    @PreAuthorize("hasAuthority('BILLING_READ')")
    public ResponseEntity<List<InsuranceClaimResponse>> listAll(
            @RequestParam(required = false) String status) {
        return ResponseEntity.ok(insuranceClaimService.listAll(status));
    }

    @GetMapping("/invoice/{invoiceId}")
    @PreAuthorize("hasAuthority('BILLING_READ')")
    public ResponseEntity<InsuranceClaimResponse> getByInvoice(@PathVariable UUID invoiceId) {
        return insuranceClaimService.listByInvoice(invoiceId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/submit")
    @PreAuthorize("hasAuthority('BILLING_WRITE')")
    public ResponseEntity<InsuranceClaimResponse> submit(@PathVariable UUID id) {
        return ResponseEntity.ok(insuranceClaimService.submit(id));
    }

    @PostMapping("/{id}/process")
    @PreAuthorize("hasAuthority('BILLING_WRITE')")
    public ResponseEntity<InsuranceClaimResponse> processResult(
            @PathVariable UUID id,
            @Valid @RequestBody ProcessClaimRequest req) {
        return ResponseEntity.ok(insuranceClaimService.processResult(id, req));
    }

    @PostMapping("/{id}/resubmit")
    @PreAuthorize("hasAuthority('BILLING_WRITE')")
    public ResponseEntity<InsuranceClaimResponse> resubmit(
            @PathVariable UUID id,
            @RequestParam String notes) {
        return ResponseEntity.ok(insuranceClaimService.resubmit(id, notes));
    }
}
