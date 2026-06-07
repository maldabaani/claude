package com.helpdesk.domain.kb.dto;

import jakarta.validation.constraints.NotBlank;

import java.util.UUID;

public record KbArticleRequest(
        @NotBlank String title,
        @NotBlank String body,
        UUID categoryId,
        String status
) {}
