package com.clinicsaas.controllers;

import com.clinicsaas.dtos.request.CreateInsurancePayerRequest;
import com.clinicsaas.dtos.request.CreateInsurancePolicyRequest;
import com.clinicsaas.dtos.response.InsurancePayerResponse;
import com.clinicsaas.dtos.response.InsurancePolicyResponse;
import com.clinicsaas.services.InsurancePolicyService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/insurance")
@RequiredArgsConstructor
@Tag(name = "Insurance")
@SecurityRequirement(name = "bearerAuth")
public class InsurancePolicyController {

    private final InsurancePolicyService insurancePolicyService;

    @GetMapping("/payers")
    @PreAuthorize("hasAuthority('BILLING_READ')")
    public ResponseEntity<List<InsurancePayerResponse>> listPayers() {
        return ResponseEntity.ok(insurancePolicyService.listPayers());
    }

    @PostMapping("/payers")
    @PreAuthorize("hasAuthority('SETTINGS_WRITE')")
    public ResponseEntity<InsurancePayerResponse> createPayer(
            @Valid @RequestBody CreateInsurancePayerRequest req) {
        return ResponseEntity.status(201).body(insurancePolicyService.createPayer(req));
    }

    @PostMapping("/policies")
    @PreAuthorize("hasAuthority('BILLING_WRITE')")
    public ResponseEntity<InsurancePolicyResponse> createPolicy(
            @Valid @RequestBody CreateInsurancePolicyRequest req) {
        return ResponseEntity.status(201).body(insurancePolicyService.createPolicy(req));
    }

    @GetMapping("/policies/patient/{patientId}")
    @PreAuthorize("hasAuthority('BILLING_READ')")
    public ResponseEntity<List<InsurancePolicyResponse>> listByPatient(
            @PathVariable UUID patientId) {
        return ResponseEntity.ok(insurancePolicyService.listByPatient(patientId));
    }

    @GetMapping("/policies/{id}")
    @PreAuthorize("hasAuthority('BILLING_READ')")
    public ResponseEntity<InsurancePolicyResponse> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(insurancePolicyService.getById(id));
    }

    @DeleteMapping("/policies/{id}")
    @PreAuthorize("hasAuthority('BILLING_WRITE')")
    public ResponseEntity<Void> deactivate(@PathVariable UUID id) {
        insurancePolicyService.deactivate(id);
        return ResponseEntity.noContent().build();
    }
}
