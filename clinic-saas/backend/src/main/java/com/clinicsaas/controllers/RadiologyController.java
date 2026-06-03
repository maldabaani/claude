package com.clinicsaas.controllers;

import com.clinicsaas.dtos.request.AddRadiologyReportRequest;
import com.clinicsaas.dtos.request.CreateRadiologyOrderRequest;
import com.clinicsaas.dtos.response.RadiologyOrderResponse;
import com.clinicsaas.security.AppUserPrincipal;
import com.clinicsaas.services.RadiologyService;
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
@RequestMapping("/api/v1/radiology-orders")
@RequiredArgsConstructor
@Tag(name = "Radiology Orders")
@SecurityRequirement(name = "bearerAuth")
public class RadiologyController {

    private final RadiologyService radiologyService;

    @PostMapping
    @PreAuthorize("hasAuthority('RADIOLOGY_WRITE')")
    public ResponseEntity<RadiologyOrderResponse> create(
            @Valid @RequestBody CreateRadiologyOrderRequest req,
            @AuthenticationPrincipal AppUserPrincipal principal) {
        return ResponseEntity.status(201).body(radiologyService.createOrder(req, principal.getId()));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('RADIOLOGY_READ')")
    public ResponseEntity<RadiologyOrderResponse> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(radiologyService.getById(id));
    }

    @GetMapping
    @PreAuthorize("hasAuthority('RADIOLOGY_READ')")
    public ResponseEntity<List<RadiologyOrderResponse>> list(
            @RequestParam(required = false) UUID visitId,
            @RequestParam(required = false) UUID patientId) {
        if (visitId != null) {
            return ResponseEntity.ok(radiologyService.listByVisit(visitId));
        }
        return ResponseEntity.ok(radiologyService.listByPatient(patientId));
    }

    @GetMapping("/all")
    @PreAuthorize("hasAuthority('RADIOLOGY_READ')")
    public ResponseEntity<List<RadiologyOrderResponse>> listAll(
            @RequestParam(required = false) String status) {
        return ResponseEntity.ok(radiologyService.listAll(status));
    }

    @PostMapping("/{id}/report")
    @PreAuthorize("hasAuthority('RADIOLOGY_WRITE')")
    public ResponseEntity<RadiologyOrderResponse> addReport(
            @PathVariable UUID id,
            @Valid @RequestBody AddRadiologyReportRequest req,
            @AuthenticationPrincipal AppUserPrincipal principal) {
        return ResponseEntity.ok(radiologyService.addReport(id, req, principal.getId()));
    }
}
