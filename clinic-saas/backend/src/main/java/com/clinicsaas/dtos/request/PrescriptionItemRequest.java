package com.clinicsaas.dtos.request;

import com.clinicsaas.entities.enums.DosageFrequency;
import com.clinicsaas.entities.enums.MedicationRoute;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record PrescriptionItemRequest(
        UUID medicationId,
        @NotBlank String medicationName,
        @NotBlank String dosage,
        @NotNull DosageFrequency frequency,
        MedicationRoute route,
        Integer durationDays,
        Integer quantity,
        String instructions
) {}
