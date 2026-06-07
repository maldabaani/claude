package com.helpdesk.domain.csat.dto;

import java.time.Instant;
import java.util.UUID;

public record CsatResponse(UUID id, UUID ticketId, int rating, String comment, Instant createdAt) {}
