package com.clinicsaas.dtos.request;

import com.clinicsaas.entities.enums.RadiologyReportStatus;
import jakarta.validation.constraints.NotBlank;

public record AddRadiologyReportRequest(
        @NotBlank String findings,
        @NotBlank String impression,
        String recommendation,
        RadiologyReportStatus status
) {}
