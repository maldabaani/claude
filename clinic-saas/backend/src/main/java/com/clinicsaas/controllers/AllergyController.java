package com.clinicsaas.controllers;

import com.clinicsaas.dtos.request.CreateAllergyRequest;
import com.clinicsaas.dtos.response.AllergyResponse;
import com.clinicsaas.services.AllergyService;
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
@RequestMapping("/api/v1/allergies")
@PreAuthorize("hasAnyRole('ADMIN','DOCTOR','NURSE')")
@RequiredArgsConstructor
@Tag(name = "Allergies")
@SecurityRequirement(name = "bearerAuth")
public class AllergyController {

    private final AllergyService allergyService;

    @PostMapping
    public ResponseEntity<AllergyResponse> add(@Valid @RequestBody CreateAllergyRequest req) {
        return ResponseEntity.status(201).body(allergyService.addAllergy(req));
    }

    @GetMapping
    public ResponseEntity<List<AllergyResponse>> listByPatient(@RequestParam UUID patientId) {
        return ResponseEntity.ok(allergyService.listByPatient(patientId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deactivate(@PathVariable UUID id) {
        allergyService.deactivate(id);
        return ResponseEntity.noContent().build();
    }
}
