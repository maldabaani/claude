package com.clinicsaas.controllers;

import com.clinicsaas.dtos.request.AddLabResultRequest;
import com.clinicsaas.dtos.request.CreateLabOrderRequest;
import com.clinicsaas.dtos.response.LabOrderResponse;
import com.clinicsaas.security.AppUserPrincipal;
import com.clinicsaas.services.LabService;
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
@RequestMapping("/api/v1/lab-orders")
@PreAuthorize("hasAnyRole('ADMIN','DOCTOR','NURSE')")
@RequiredArgsConstructor
@Tag(name = "Lab Orders")
@SecurityRequirement(name = "bearerAuth")
public class LabController {

    private final LabService labService;

    @PostMapping
    public ResponseEntity<LabOrderResponse> create(
            @Valid @RequestBody CreateLabOrderRequest req,
            @AuthenticationPrincipal AppUserPrincipal principal) {
        return ResponseEntity.status(201).body(labService.createOrder(req, principal.getId()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<LabOrderResponse> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(labService.getById(id));
    }

    @GetMapping
    public ResponseEntity<List<LabOrderResponse>> listByVisit(@RequestParam UUID visitId) {
        return ResponseEntity.ok(labService.listByVisit(visitId));
    }

    @PutMapping("/items/{itemId}/result")
    public ResponseEntity<Void> addResult(
            @PathVariable UUID itemId,
            @Valid @RequestBody AddLabResultRequest req,
            @AuthenticationPrincipal AppUserPrincipal principal) {
        labService.addResult(itemId, req, principal.getId());
        return ResponseEntity.noContent().build();
    }
}
