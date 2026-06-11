package com.helpdesk.domain.user.dto;

import com.helpdesk.domain.user.entity.AvailabilityStatus;

import java.time.Instant;
import java.util.UUID;

public record AgentAvailabilityResponse(
        UUID id,
        String fullName,
        String email,
        String avatarUrl,
        AvailabilityStatus availabilityStatus,
        Instant availabilityUpdatedAt
) {}
