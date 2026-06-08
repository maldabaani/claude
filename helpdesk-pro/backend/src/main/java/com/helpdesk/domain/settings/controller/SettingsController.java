package com.helpdesk.domain.settings.controller;

import com.helpdesk.domain.settings.dto.SettingsRequest;
import com.helpdesk.domain.settings.dto.SettingsResponse;
import com.helpdesk.domain.settings.service.SettingsService;
import com.helpdesk.shared.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/settings")
@RequiredArgsConstructor
public class SettingsController {

    private final SettingsService settingsService;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<SettingsResponse>> get() {
        return ResponseEntity.ok(ApiResponse.ok(settingsService.getAll()));
    }

    @PutMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<SettingsResponse>> update(@RequestBody SettingsRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(settingsService.update(request)));
    }
}
