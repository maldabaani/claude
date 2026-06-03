package com.clinicsaas.controllers;

import com.clinicsaas.entities.enums.Permission;
import com.clinicsaas.security.AppUserPrincipal;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/me")
public class MeController {

    @GetMapping
    public ResponseEntity<Map<String, Object>> me(@AuthenticationPrincipal AppUserPrincipal principal) {
        List<String> permissions = principal.getPermissions().stream()
                .map(Permission::name)
                .sorted()
                .toList();
        return ResponseEntity.ok(Map.of(
                "id",          principal.getId(),
                "email",       principal.getEmail(),
                "role",        principal.getRole(),
                "tenantId",    principal.getTenantId() != null ? principal.getTenantId() : "",
                "userType",    principal.getUserType(),
                "permissions", permissions
        ));
    }
}
