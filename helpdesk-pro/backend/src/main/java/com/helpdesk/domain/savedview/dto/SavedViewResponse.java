package com.helpdesk.domain.savedview.dto;

import java.time.Instant;
import java.util.UUID;

public record SavedViewResponse(
        UUID id,
        String name,
        String filterJson,
        Instant createdAt
) {}
