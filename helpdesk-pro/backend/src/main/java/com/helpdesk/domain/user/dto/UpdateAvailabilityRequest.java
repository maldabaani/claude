package com.helpdesk.domain.user.dto;

import com.helpdesk.domain.user.entity.AvailabilityStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateAvailabilityRequest(
        @NotNull AvailabilityStatus status
) {}
