package com.helpdesk.domain.tag;

import java.time.Instant;
import java.util.UUID;

public record TagResponse(
        UUID id,
        String name,
        String color,
        long usageCount,
        Instant createdAt
) {}
