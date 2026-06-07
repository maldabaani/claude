package com.helpdesk.domain.audit.dto;

import java.time.Instant;
import java.util.UUID;

public record AuditLogResponse(
    UUID id,
    String entityType,
    UUID entityId,
    String action,
    UUID performedById,
    String performedByName,
    String oldValue,
    String newValue,
    Instant createdAt
) {}
