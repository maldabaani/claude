package com.clinicsaas.dtos.request;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;
import java.util.UUID;

public record CreateAppointmentRequest(
        @NotNull UUID patientId,
        @NotNull UUID doctorId,
        @NotNull @Future LocalDateTime scheduledAt,
        @Min(10) int durationMinutes,
        String appointmentType,
        String notes
) {}
