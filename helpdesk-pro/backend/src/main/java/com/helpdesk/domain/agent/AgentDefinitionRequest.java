package com.helpdesk.domain.agent;

import java.util.List;

public record AgentDefinitionRequest(
        String name,
        String description,
        String triggerCategory,
        List<String> keywords,
        String capability,
        boolean autoClose,
        boolean active
) {}
