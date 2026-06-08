package com.clinicsaas.dtos.response;

import java.util.Map;

public record ClinicSettingsResponse(
        Map<String, String> settings
) {}
