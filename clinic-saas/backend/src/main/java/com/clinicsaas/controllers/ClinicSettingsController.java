package com.clinicsaas.controllers;

import com.clinicsaas.dtos.request.UpdateSettingsRequest;
import com.clinicsaas.dtos.response.ClinicSettingsResponse;
import com.clinicsaas.services.ClinicSettingsService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/settings")
@RequiredArgsConstructor
@Tag(name = "Clinic Settings")
@SecurityRequirement(name = "bearerAuth")
public class ClinicSettingsController {

    private final ClinicSettingsService clinicSettingsService;

    @GetMapping("/")
    @PreAuthorize("hasAuthority('SETTINGS_READ') or hasAuthority('SETTINGS_WRITE')")
    public ResponseEntity<ClinicSettingsResponse> getAll() {
        return ResponseEntity.ok(clinicSettingsService.getAll());
    }

    @PutMapping("/")
    @PreAuthorize("hasAuthority('SETTINGS_WRITE')")
    public ResponseEntity<ClinicSettingsResponse> update(@RequestBody UpdateSettingsRequest req) {
        return ResponseEntity.ok(clinicSettingsService.update(req));
    }
}
