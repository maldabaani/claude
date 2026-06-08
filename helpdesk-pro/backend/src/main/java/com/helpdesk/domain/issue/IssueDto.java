package com.helpdesk.domain.issue;

import java.time.Instant;
import java.util.UUID;

public record IssueDto(
        UUID id,
        String title,
        String description,
        String status,
        String priority,
        String createdByName,
        String assignedToName,
        long ticketCount,
        Instant createdAt
) {}
