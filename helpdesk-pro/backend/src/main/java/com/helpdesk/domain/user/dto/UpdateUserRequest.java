package com.helpdesk.domain.user.dto;

import com.helpdesk.domain.user.entity.Role;
import jakarta.validation.constraints.NotBlank;

import java.util.UUID;

public record UpdateUserRequest(
        @NotBlank String fullName,
        UUID departmentId,
        String avatarUrl,
        Boolean active,
        Role role
) {}
