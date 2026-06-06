package com.helpdesk.domain.comment.dto;

import com.helpdesk.domain.user.dto.UserResponse;

import java.time.Instant;
import java.util.UUID;

public record CommentResponse(
        UUID id,
        UUID ticketId,
        UserResponse author,
        String body,
        boolean internal,
        Instant createdAt,
        Instant updatedAt
) {}
