package com.clinicsaas.controllers;

import com.clinicsaas.dtos.request.CreateVisitRequest;
import com.clinicsaas.dtos.request.UpdateVitalSignsRequest;
import com.clinicsaas.dtos.response.QueueItemResponse;
import com.clinicsaas.dtos.response.VitalSignsResponse;
import com.clinicsaas.dtos.response.VisitResponse;
import com.clinicsaas.security.AppUserPrincipal;
import com.clinicsaas.services.VisitService;
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

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/visits")
@PreAuthorize("hasAnyRole('ADMIN','DOCTOR','NURSE','RECEPTIONIST')")
@RequiredArgsConstructor
@Tag(name = "Visits")
@SecurityRequirement(name = "bearerAuth")
public class VisitController {

    private final VisitService visitService;

    @PostMapping
    public ResponseEntity<VisitResponse> create(
            @Valid @RequestBody CreateVisitRequest req,
            @AuthenticationPrincipal AppUserPrincipal principal) {
        return ResponseEntity.status(201).body(visitService.createVisit(req, principal.getId()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<VisitResponse> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(visitService.getById(id));
    }

    @GetMapping
    public ResponseEntity<Page<VisitResponse>> listByPatient(
            @RequestParam UUID patientId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(visitService.listByPatient(patientId, PageRequest.of(page, size)));
    }

    @PostMapping("/{id}/vitals")
    public ResponseEntity<Void> recordVitals(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateVitalSignsRequest req,
            @AuthenticationPrincipal AppUserPrincipal principal) {
        visitService.recordVitals(id, req, principal.getId());
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/checkout")
    public ResponseEntity<VisitResponse> checkout(@PathVariable UUID id) {
        return ResponseEntity.ok(visitService.checkout(id));
    }

    @GetMapping("/queue")
    public ResponseEntity<List<QueueItemResponse>> queue() {
        return ResponseEntity.ok(visitService.getQueue());
    }

    @GetMapping("/vitals")
    public ResponseEntity<List<VitalSignsResponse>> vitalsByPatient(@RequestParam UUID patientId) {
        return ResponseEntity.ok(visitService.getVitalsByPatient(patientId));
    }
}
