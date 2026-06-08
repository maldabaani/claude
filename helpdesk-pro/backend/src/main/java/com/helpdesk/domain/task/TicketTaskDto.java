package com.helpdesk.domain.task;

import java.time.Instant;
import java.util.UUID;

public record TicketTaskDto(
        UUID id,
        UUID ticketId,
        String title,
        boolean completed,
        UUID assignedToId,
        String assignedToName,
        Instant dueDate,
        Instant createdAt
) {}
