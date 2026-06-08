package com.helpdesk.domain.emailinbox;

import java.time.Instant;
import java.util.UUID;

public record EmailInboxDto(
        UUID id,
        String name,
        String email,
        String host,
        int port,
        String username,
        String protocol,
        boolean useSsl,
        UUID defaultDepartmentId,
        String defaultPriority,
        boolean active,
        Instant lastCheckedAt
) {}
