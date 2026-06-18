package com.helpdesk.domain.agent;

import java.time.Instant;
import java.util.List;

public record AgentDefinitionResponse(
        Long id,
        String name,
        String description,
        String triggerCategory,
        List<String> keywords,
        AgentCapability capability,
        boolean autoClose,
        boolean active,
        Instant createdAt,
        Instant updatedAt
) {}
