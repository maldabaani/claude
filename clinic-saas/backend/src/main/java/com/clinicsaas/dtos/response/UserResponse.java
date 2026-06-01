package com.clinicsaas.dtos.response;

import com.clinicsaas.entities.enums.Role;
import com.clinicsaas.entities.tenant.User;

import java.time.LocalDateTime;
import java.util.UUID;

public record UserResponse(
        UUID id,
        String email,
        String firstName,
        String lastName,
        Role role,
        boolean active,
        LocalDateTime createdAt
) {
    public static UserResponse from(User u) {
        return new UserResponse(
                u.getId(),
                u.getEmail(),
                u.getFirstName(),
                u.getLastName(),
                u.getRole(),
                u.isActive(),
                u.getCreatedAt()
        );
    }
}
