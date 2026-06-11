package com.helpdesk.domain.nps.dto;

import java.time.Instant;
import java.util.UUID;

public record NpsResponseDto(
    UUID id,
    UUID ticketId,
    int score,
    String comment,
    Instant submittedAt
) {}
