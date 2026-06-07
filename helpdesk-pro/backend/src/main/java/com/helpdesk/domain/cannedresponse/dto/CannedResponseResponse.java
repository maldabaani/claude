package com.helpdesk.domain.cannedresponse.dto;

import java.time.Instant;
import java.util.UUID;

public record CannedResponseResponse(
    UUID id,
    String title,
    String body,
    String category,
    Instant createdAt
) {}
