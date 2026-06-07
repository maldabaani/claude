package com.helpdesk.domain.settings.dto;

public record SettingsResponse(
        String companyName,
        String supportEmail,
        boolean notifyTicketCreated,
        boolean notifyCommentAdded,
        boolean notifyStatusChanged,
        boolean notifyTicketAssigned,
        boolean notifySlaBreached
) {}
