package com.clinicsaas.dtos.response;

public record AuthResponse(
        String accessToken,
        String tokenType,
        long expiresIn,
        String role,
        String tenantId
) {
    public static AuthResponse of(String token, long expiresIn, String role, String tenantId) {
        return new AuthResponse(token, "Bearer", expiresIn, role, tenantId);
    }
}
