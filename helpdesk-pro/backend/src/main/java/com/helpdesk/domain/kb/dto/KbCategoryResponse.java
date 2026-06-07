package com.helpdesk.domain.kb.dto;

import java.util.UUID;

public record KbCategoryResponse(
        UUID id,
        String name,
        String description,
        String icon,
        long articleCount
) {}
