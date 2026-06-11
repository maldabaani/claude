package com.helpdesk.domain.ticket.dto;

import java.time.Instant;
import java.util.UUID;

public record TicketDraftResponse(
    UUID id,
    UUID ticketId,
    UUID agentId,
    String content,
    boolean isInternal,
    Instant updatedAt
) {}
