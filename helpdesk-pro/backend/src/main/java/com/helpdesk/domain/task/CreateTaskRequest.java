package com.helpdesk.domain.task;

import java.time.Instant;
import java.util.UUID;

public record CreateTaskRequest(
        String title,
        UUID assignedToId,
        Instant dueDate
) {}
