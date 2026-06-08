package com.helpdesk.domain.user.dto;

import jakarta.validation.constraints.Size;

public record UpdateProfileRequest(
    String fullName,
    String currentPassword,
    @Size(min = 8) String newPassword
) {}
