package com.helpdesk.domain.customerprofile.dto;

import java.time.Instant;
import java.util.UUID;

public record CustomerNoteResponse(
        UUID id,
        UUID customerId,
        UUID agentId,
        String agentName,
        String content,
        Instant createdAt,
        Instant updatedAt
) {}
