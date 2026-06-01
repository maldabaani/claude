package com.clinicsaas.dtos.request;

import java.math.BigDecimal;

public record UpdateVitalSignsRequest(
        Integer bpSystolic,
        Integer bpDiastolic,
        Integer heartRate,
        Integer respiratoryRate,
        BigDecimal temperature,
        BigDecimal oxygenSaturation,
        BigDecimal weightKg,
        BigDecimal heightCm,
        BigDecimal bloodGlucose,
        String notes
) {}
