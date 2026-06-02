package com.clinicsaas.dtos.response;

import com.clinicsaas.entities.enums.Permission;
import com.clinicsaas.security.RolePermissions;

import java.util.List;

public record AuthResponse(
        String accessToken,
        String tokenType,
        long expiresIn,
        String role,
        String tenantId,
        List<String> permissions
) {
    public static AuthResponse of(String token, long expiresIn, String role, String tenantId) {
        List<String> perms = RolePermissions.forRole(role)
                .stream()
                .map(Permission::name)
                .sorted()
                .toList();
        return new AuthResponse(token, "Bearer", expiresIn, role, tenantId, perms);
    }

    public static AuthResponse ofPlatformAdmin(String token, long expiresIn, String role) {
        List<String> perms = java.util.Arrays.stream(Permission.values())
                .map(Permission::name)
                .sorted()
                .toList();
        return new AuthResponse(token, "Bearer", expiresIn, role, null, perms);
    }
}
