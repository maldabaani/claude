package com.clinicsaas.controllers;

import com.clinicsaas.dtos.request.AddPaymentRequest;
import com.clinicsaas.dtos.request.CreateInvoiceRequest;
import com.clinicsaas.dtos.response.InvoiceResponse;
import com.clinicsaas.security.AppUserPrincipal;
import com.clinicsaas.services.InvoiceService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/invoices")
@PreAuthorize("hasAnyRole('ADMIN','RECEPTIONIST')")
@RequiredArgsConstructor
@Tag(name = "Invoices")
@SecurityRequirement(name = "bearerAuth")
public class InvoiceController {

    private final InvoiceService invoiceService;

    @PostMapping
    public ResponseEntity<InvoiceResponse> create(
            @Valid @RequestBody CreateInvoiceRequest req,
            @AuthenticationPrincipal AppUserPrincipal principal) {
        return ResponseEntity.status(201).body(invoiceService.create(req));
    }

    @GetMapping("/{id}")
    public ResponseEntity<InvoiceResponse> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(invoiceService.getById(id));
    }

    @GetMapping
    public ResponseEntity<Page<InvoiceResponse>> listByPatient(
            @RequestParam UUID patientId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(invoiceService.listByPatient(patientId, PageRequest.of(page, size)));
    }

    @PostMapping("/{id}/payments")
    public ResponseEntity<InvoiceResponse> addPayment(
            @PathVariable UUID id,
            @Valid @RequestBody AddPaymentRequest req,
            @AuthenticationPrincipal AppUserPrincipal principal) {
        return ResponseEntity.ok(invoiceService.addPayment(id, req, principal.getId()));
    }
}
