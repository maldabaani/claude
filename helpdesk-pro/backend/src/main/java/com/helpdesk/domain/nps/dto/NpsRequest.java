package com.helpdesk.domain.nps.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record NpsRequest(
    @NotNull @Min(0) @Max(10) Integer score,
    String comment
) {}
