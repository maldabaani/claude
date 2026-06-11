package com.helpdesk.domain.macro;

public record MacroRequest(
        String name,
        String description,
        String actions
) {}
