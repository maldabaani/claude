package com.helpdesk.domain.webhook;

public record WebhookRequest(
    String name,
    String url,
    String secret,
    String events,
    Boolean active
) {}
