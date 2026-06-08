package com.helpdesk.domain.emailinbox;

import jakarta.validation.constraints.*;
import java.util.UUID;

public record CreateEmailInboxRequest(
        @NotBlank String name,
        @NotBlank @Email String email,
        @NotBlank String host,
        @Min(1) @Max(65535) int port,
        @NotBlank String username,
        @NotBlank String password,
        String protocol,
        boolean useSsl,
        UUID defaultDepartmentId,
        String defaultPriority
) {}
