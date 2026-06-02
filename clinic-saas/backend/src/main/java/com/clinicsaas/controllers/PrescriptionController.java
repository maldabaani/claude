package com.clinicsaas.controllers;

import com.clinicsaas.dtos.request.CreatePrescriptionRequest;
import com.clinicsaas.dtos.response.PrescriptionResponse;
import com.clinicsaas.security.AppUserPrincipal;
import com.clinicsaas.services.PrescriptionService;
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
@RequestMapping("/api/v1/prescriptions")
@RequiredArgsConstructor
@Tag(name = "Prescriptions")
@SecurityRequirement(name = "bearerAuth")
public class PrescriptionController {

    private final PrescriptionService prescriptionService;

    @PostMapping
    @PreAuthorize("hasAuthority('PRESCRIPTION_WRITE')")
    public ResponseEntity<PrescriptionResponse> create(
            @Valid @RequestBody CreatePrescriptionRequest req,
            @AuthenticationPrincipal AppUserPrincipal principal) {
        return ResponseEntity.status(201).body(prescriptionService.create(req, principal.getId()));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('PRESCRIPTION_READ')")
    public ResponseEntity<PrescriptionResponse> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(prescriptionService.getById(id));
    }

    @GetMapping
    @PreAuthorize("hasAuthority('PRESCRIPTION_READ')")
    public ResponseEntity<List<PrescriptionResponse>> listByPatient(@RequestParam UUID patientId) {
        return ResponseEntity.ok(prescriptionService.listByPatient(patientId));
    }

    @GetMapping("/all")
    @PreAuthorize("hasAuthority('PRESCRIPTION_READ')")
    public ResponseEntity<List<PrescriptionResponse>> listAll(
            @RequestParam(required = false) String status) {
        return ResponseEntity.ok(prescriptionService.listAll(status));
    }
}
