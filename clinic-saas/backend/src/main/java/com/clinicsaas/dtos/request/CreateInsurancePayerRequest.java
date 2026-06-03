package com.clinicsaas.dtos.request;

import jakarta.validation.constraints.NotBlank;

public record CreateInsurancePayerRequest(
        @NotBlank String name,
        @NotBlank String shortCode,
        String contactEmail,
        String portalUrl
) {}
