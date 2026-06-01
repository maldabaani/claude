package com.clinicsaas.dtos.request;

import com.clinicsaas.entities.enums.MedicalHistoryStatus;
import com.clinicsaas.entities.enums.MedicalHistoryType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.UUID;

public record CreateMedicalHistoryRequest(
        @NotNull UUID patientId,
        @NotNull MedicalHistoryType historyType,
        @NotBlank String conditionName,
        String icdCode,
        MedicalHistoryStatus status,
        LocalDate onsetDate,
        String notes
) {}
