package com.clinicsaas.dtos.request;

import java.util.Map;

public record UpdateSettingsRequest(
        Map<String, String> settings
) {}
