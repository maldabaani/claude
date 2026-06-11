package com.helpdesk.domain.timeentry;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;

public record TimeEntryRequest(
        @NotNull @Min(1) Integer minutes,
        String note,
        LocalDateTime loggedAt
) {}
