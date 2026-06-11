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
) {
    public static AutomationRuleDto from(AutomationRule rule) {
        return new AutomationRuleDto(
                rule.getId(),
                rule.getName(),
                rule.isActive(),
                rule.getTriggerType(),
                rule.getTriggerEvent(),
                rule.getTriggerHours(),
                rule.getConditions(),
                rule.getActions(),
                rule.getRunOrder(),
                rule.getCreatedAt(),
                rule.getUpdatedAt()
        );
    }
}
