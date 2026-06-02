package com.clinicsaas.controllers;

import com.clinicsaas.dtos.request.CreateDiagnosisRequest;
import com.clinicsaas.dtos.response.DiagnosisResponse;
import com.clinicsaas.security.AppUserPrincipal;
import com.clinicsaas.services.DiagnosisService;
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
@RequestMapping("/api/v1/diagnoses")
@RequiredArgsConstructor
@Tag(name = "Diagnoses")
@SecurityRequirement(name = "bearerAuth")
public class DiagnosisController {

    private final DiagnosisService diagnosisService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR')")
    public ResponseEntity<DiagnosisResponse> add(
            @Valid @RequestBody CreateDiagnosisRequest req,
            @AuthenticationPrincipal AppUserPrincipal principal) {
        return ResponseEntity.status(201).body(diagnosisService.addDiagnosis(req, principal.getId()));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR','NURSE')")
    public ResponseEntity<List<DiagnosisResponse>> listByVisit(@RequestParam UUID visitId) {
        return ResponseEntity.ok(diagnosisService.listByVisit(visitId));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR')")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        diagnosisService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
