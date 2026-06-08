package com.clinicsaas.controllers;

import com.clinicsaas.dtos.request.CreatePreAuthRequest;
import com.clinicsaas.dtos.request.ProcessPreAuthRequest;
import com.clinicsaas.dtos.response.PreAuthorizationResponse;
import com.clinicsaas.entities.enums.PreAuthorizationStatus;
import com.clinicsaas.security.AppUserPrincipal;
import com.clinicsaas.services.PreAuthorizationService;
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
@RequestMapping("/api/v1/insurance/preauth")
@RequiredArgsConstructor
@Tag(name = "Pre-Authorization")
@SecurityRequirement(name = "bearerAuth")
public class PreAuthorizationController {

    private final PreAuthorizationService preAuthorizationService;

    @PostMapping
    @PreAuthorize("hasAuthority('BILLING_WRITE')")
    public ResponseEntity<PreAuthorizationResponse> create(
            @Valid @RequestBody CreatePreAuthRequest req,
            @AuthenticationPrincipal AppUserPrincipal principal) {
        return ResponseEntity.status(201).body(preAuthorizationService.create(req, principal.getId()));
    }

    @GetMapping("/patient/{patientId}")
    @PreAuthorize("hasAuthority('BILLING_READ')")
    public ResponseEntity<List<PreAuthorizationResponse>> listByPatient(@PathVariable UUID patientId) {
        return ResponseEntity.ok(preAuthorizationService.listByPatient(patientId));
    }

    @GetMapping
    @PreAuthorize("hasAuthority('BILLING_READ')")
    public ResponseEntity<List<PreAuthorizationResponse>> listAll(
            @RequestParam(required = false) PreAuthorizationStatus status) {
        return ResponseEntity.ok(preAuthorizationService.listAll(status));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('BILLING_READ')")
    public ResponseEntity<PreAuthorizationResponse> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(preAuthorizationService.getById(id));
    }

    @PostMapping("/{id}/submit")
    @PreAuthorize("hasAuthority('BILLING_WRITE')")
    public ResponseEntity<PreAuthorizationResponse> submit(@PathVariable UUID id) {
        return ResponseEntity.ok(preAuthorizationService.submit(id));
    }

    @PostMapping("/{id}/process")
    @PreAuthorize("hasAuthority('BILLING_WRITE')")
    public ResponseEntity<PreAuthorizationResponse> processResult(
            @PathVariable UUID id,
            @Valid @RequestBody ProcessPreAuthRequest req) {
        return ResponseEntity.ok(preAuthorizationService.processResult(id, req));
    }
}
