package com.clinicsaas.controllers;

import com.clinicsaas.dtos.request.LoginRequest;
import com.clinicsaas.dtos.response.AuthResponse;
import com.clinicsaas.services.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/platform/login")
    @Operation(summary = "Platform admin login")
    public ResponseEntity<AuthResponse> platformLogin(@Valid @RequestBody LoginRequest req) {
        return ResponseEntity.ok(authService.loginPlatform(req));
    }

    @PostMapping("/login")
    @Operation(summary = "Clinic staff login (requires tenantId)")
    public ResponseEntity<AuthResponse> tenantLogin(@Valid @RequestBody LoginRequest req) {
        return ResponseEntity.ok(authService.loginTenant(req));
    }
}
