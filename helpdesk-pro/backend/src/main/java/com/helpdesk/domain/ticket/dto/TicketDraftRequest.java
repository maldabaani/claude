package com.helpdesk.domain.ticket.dto;

import jakarta.validation.constraints.NotNull;

public record TicketDraftRequest(
    @NotNull String content,
    boolean isInternal
) {}
