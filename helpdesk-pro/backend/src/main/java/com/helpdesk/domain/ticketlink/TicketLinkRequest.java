package com.helpdesk.domain.ticketlink;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record TicketLinkRequest(
        @NotNull UUID targetTicketId,
        @NotNull LinkType linkType
) {}
