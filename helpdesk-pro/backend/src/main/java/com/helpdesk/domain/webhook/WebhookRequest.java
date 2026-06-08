package com.helpdesk.domain.webhook;

import jakarta.validation.constraints.NotBlank;
import org.hibernate.validator.constraints.URL;

public record WebhookRequest(
    @NotBlank String name,
    @NotBlank @URL String url,
    String secret,
    String events,
    Boolean active
) {}
