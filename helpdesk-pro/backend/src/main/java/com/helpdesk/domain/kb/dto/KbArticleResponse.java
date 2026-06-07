package com.helpdesk.domain.kb.dto;

import java.time.Instant;
import java.util.UUID;

public record KbArticleResponse(
        UUID id,
        String title,
        String slug,
        String body,
        String status,
        UUID categoryId,
        String categoryName,
        int viewCount,
        int helpfulYes,
        int helpfulNo,
        Instant createdAt,
        Instant updatedAt
) {}
