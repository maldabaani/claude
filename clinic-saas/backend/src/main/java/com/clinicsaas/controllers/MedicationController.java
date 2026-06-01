package com.clinicsaas.controllers;

import com.clinicsaas.dtos.response.MedicationResponse;
import com.clinicsaas.services.MedicationService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/medications")
@PreAuthorize("hasAnyRole('ADMIN','DOCTOR','NURSE')")
@RequiredArgsConstructor
@Tag(name = "Medications")
@SecurityRequirement(name = "bearerAuth")
public class MedicationController {

    private final MedicationService medicationService;

    @GetMapping
    public ResponseEntity<List<MedicationResponse>> list() {
        return ResponseEntity.ok(medicationService.listActive());
    }
}
