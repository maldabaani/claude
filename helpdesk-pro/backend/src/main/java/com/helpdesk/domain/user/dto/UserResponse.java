package com.helpdesk.domain.user.dto;

import com.helpdesk.domain.user.entity.Role;

import java.time.Instant;
import java.util.UUID;

public record UserResponse(
        UUID id,
        String fullName,
        String email,
        Role role,
        UUID departmentId,
        String avatarUrl,
        boolean active,
        Instant createdAt
) {}
