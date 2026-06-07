package com.helpdesk.domain.cannedresponse.dto;

import jakarta.validation.constraints.NotBlank;

public record CannedResponseRequest(
    @NotBlank String title,
    @NotBlank String body,
    String category
) {}
