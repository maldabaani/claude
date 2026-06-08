package com.helpdesk.domain.helptopic;

import java.util.UUID;

public record HelpTopicDto(
        UUID id,
        String name,
        String description,
        UUID departmentId,
        String defaultPriority,
        boolean autoAssignTeamLead,
        int displayOrder
) {}
