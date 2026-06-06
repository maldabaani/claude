package com.helpdesk.domain.user.dto;

import com.helpdesk.domain.user.entity.Role;

import java.util.UUID;

public record AuthResponse(
        String accessToken,
        String refreshToken,
        UUID userId,
        String fullName,
        String email,
        Role role
) {}
