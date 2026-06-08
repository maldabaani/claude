package com.helpdesk.domain.organization;

import java.util.UUID;

public record OrganizationDto(
        UUID id,
        String name,
        String domain,
        String phone,
        String address,
        String notes,
        long memberCount
) {}
