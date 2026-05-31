package com.clinicsaas.dtos.response;

import com.clinicsaas.entities.platform.Tenant;

import java.time.LocalDateTime;
import java.util.UUID;

public record TenantResponse(
        UUID id,
        String name,
        String dbName,
        String adminEmail,
        boolean active,
        LocalDateTime createdAt
) {
    public static TenantResponse from(Tenant t) {
        return new TenantResponse(t.getId(), t.getName(), t.getDbName(),
                t.getAdminEmail(), t.isActive(), t.getCreatedAt());
    }
}
