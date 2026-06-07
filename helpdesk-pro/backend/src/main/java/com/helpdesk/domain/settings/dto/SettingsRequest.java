package com.helpdesk.domain.settings.dto;

public record SettingsRequest(
        String companyName,
        String supportEmail,
        Boolean notifyTicketCreated,
        Boolean notifyCommentAdded,
        Boolean notifyStatusChanged,
        Boolean notifyTicketAssigned,
        Boolean notifySlaBreached
) {}
