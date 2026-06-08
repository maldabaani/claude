package com.helpdesk.domain.organization;

public record OrganizationRequest(
        String name,
        String domain,
        String phone,
        String address,
        String notes
) {}
