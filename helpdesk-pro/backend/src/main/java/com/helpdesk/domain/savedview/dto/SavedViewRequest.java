package com.helpdesk.domain.savedview.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SavedViewRequest(
        @NotBlank @Size(max = 100) String name,
        @NotBlank String filterJson
) {}
