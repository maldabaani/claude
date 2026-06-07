package com.helpdesk.domain.ticket.dto;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;
import java.util.UUID;

public record BulkTicketRequest(
    @NotEmpty List<UUID> ticketIds,
    String action,   // "CLOSE", "RESOLVE", "ASSIGN", "TAG"
    UUID agentId,
    String tag
) {}
