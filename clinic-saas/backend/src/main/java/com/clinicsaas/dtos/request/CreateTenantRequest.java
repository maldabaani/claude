package com.clinicsaas.dtos.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CreateTenantRequest(
        @NotBlank @Size(min = 2, max = 100) String name,

        @NotBlank
        @Pattern(regexp = "^[a-z0-9_]{3,50}$",
                 message = "dbName must be 3-50 lowercase alphanumeric characters or underscores")
        String dbName,

        @NotBlank @Email String adminEmail,
        @NotBlank @Size(min = 8) String adminPassword
) {}
