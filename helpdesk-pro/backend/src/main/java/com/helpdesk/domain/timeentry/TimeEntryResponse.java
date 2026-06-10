package com.helpdesk.domain.timeentry;

import java.time.LocalDateTime;
import java.util.UUID;

public record TimeEntryResponse(
        UUID id,
        UUID ticketId,
        UUID agentId,
        String agentName,
        Integer minutes,
        String note,
        LocalDateTime loggedAt
) {}
