package com.helpdesk.domain.automation;

import java.time.Instant;

public record AutomationRuleDto(
        Long id,
        String name,
        boolean active,
        String triggerType,
        String triggerEvent,
        Integer triggerHours,
        String conditions,
        String actions,
        int runOrder,
        Instant createdAt,
        Instant updatedAt
) {}
