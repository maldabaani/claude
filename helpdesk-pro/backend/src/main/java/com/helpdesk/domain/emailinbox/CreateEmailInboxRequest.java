package com.helpdesk.domain.emailinbox;

import java.util.UUID;

public record CreateEmailInboxRequest(
        String name,
        String email,
        String host,
        int port,
        String username,
        String password,
        String protocol,
        boolean useSsl,
        UUID defaultDepartmentId,
        String defaultPriority
) {}
