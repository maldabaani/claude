package com.clinicsaas.dtos.request;

import com.clinicsaas.entities.enums.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

public record CreateUserRequest(
        @NotBlank @Email String email,
        @NotBlank
        @Pattern(
            regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$",
            message = "Password must be 8+ characters with uppercase, lowercase, digit and special character (@$!%*?&)"
        )
        String password,
        @NotBlank String firstName,
        @NotBlank String lastName,
        @NotNull Role role
) {}
