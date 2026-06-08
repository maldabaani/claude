package com.helpdesk.domain.user.dto;

public record TwoFactorLoginResponse(
        boolean requiresTwoFactor,
        String tempToken
) {}
