package com.clinicsaas.controllers;

import com.clinicsaas.dtos.request.CreatePatientRequest;
import com.clinicsaas.dtos.response.PatientResponse;
import com.clinicsaas.services.PatientService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/patients")
@RequiredArgsConstructor
@Tag(name = "Patients")
public class PatientController {

    private final PatientService patientService;

    @PostMapping
    @Operation(summary = "Register a new patient")
    public ResponseEntity<PatientResponse> create(@Valid @RequestBody CreatePatientRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(patientService.create(req));
    }

    @GetMapping
    @Operation(summary = "Search / list patients")
    public ResponseEntity<Page<PatientResponse>> search(
            @RequestParam(required = false) String q,
            @PageableDefault(size = 20, sort = "lastName") Pageable pageable) {
        return ResponseEntity.ok(patientService.search(q, pageable));
    }

    @GetMapping("/search")
    @Operation(summary = "Search patients by query string")
    public ResponseEntity<Page<PatientResponse>> searchByQuery(
            @RequestParam(required = false) String query,
            @PageableDefault(size = 20, sort = "lastName") Pageable pageable) {
        return ResponseEntity.ok(patientService.search(query, pageable));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get patient by ID")
    public ResponseEntity<PatientResponse> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(patientService.getById(id));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Deactivate patient (soft delete)")
    public ResponseEntity<Void> deactivate(@PathVariable UUID id) {
        patientService.deactivate(id);
        return ResponseEntity.noContent().build();
    }
}
