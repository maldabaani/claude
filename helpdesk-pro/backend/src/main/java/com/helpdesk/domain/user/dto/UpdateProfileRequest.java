package com.helpdesk.domain.user.dto;

public record UpdateProfileRequest(
    String fullName,
    String currentPassword,
    String newPassword
) {}
