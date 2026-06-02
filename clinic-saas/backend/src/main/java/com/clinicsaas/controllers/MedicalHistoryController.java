package com.clinicsaas.controllers;

import com.clinicsaas.dtos.request.CreateMedicalHistoryRequest;
import com.clinicsaas.dtos.response.MedicalHistoryResponse;
import com.clinicsaas.services.MedicalHistoryService;
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
@RequestMapping("/api/v1/medical-history")
@PreAuthorize("hasAnyRole('ADMIN','DOCTOR','NURSE')")
@RequiredArgsConstructor
@Tag(name = "Medical History")
@SecurityRequirement(name = "bearerAuth")
public class MedicalHistoryController {

    private final MedicalHistoryService medicalHistoryService;

    @PostMapping
    public ResponseEntity<MedicalHistoryResponse> add(@Valid @RequestBody CreateMedicalHistoryRequest req) {
        return ResponseEntity.status(201).body(medicalHistoryService.add(req));
    }

    @GetMapping
    public ResponseEntity<List<MedicalHistoryResponse>> listByPatient(@RequestParam UUID patientId) {
        return ResponseEntity.ok(medicalHistoryService.listByPatient(patientId));
    }
}
