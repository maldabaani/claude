package com.clinicsaas.dtos.response;

import com.clinicsaas.entities.tenant.VitalSigns;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public record VitalSignsResponse(
        UUID id,
        UUID visitId,
        LocalDateTime recordedAt,
        Integer bpSystolic,
        Integer bpDiastolic,
        Integer heartRate,
        Integer respiratoryRate,
        BigDecimal temperature,
        BigDecimal oxygenSaturation,
        BigDecimal weightKg,
        BigDecimal heightCm,
        BigDecimal bmi,
        BigDecimal bloodGlucose,
        String notes
) {
    public static VitalSignsResponse from(VitalSigns v) {
        return new VitalSignsResponse(
                v.getId(),
                v.getVisit().getId(),
                v.getCreatedAt(),
                v.getBpSystolic(),
                v.getBpDiastolic(),
                v.getHeartRate(),
                v.getRespiratoryRate(),
                v.getTemperature(),
                v.getOxygenSaturation(),
                v.getWeightKg(),
                v.getHeightCm(),
                v.getBmi(),
                v.getBloodGlucose(),
                v.getNotes()
        );
    }
}
