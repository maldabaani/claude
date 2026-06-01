package com.clinicsaas.dtos.request;

import com.clinicsaas.entities.enums.DiagnosisType;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record CreateDiagnosisRequest(
        @NotNull UUID visitId,
        @NotNull UUID patientId,
        @NotNull DiagnosisType diagnosisType,
        String icdCode,
        String icdDescription,
        String clinicalDescription,
        boolean chronic
) {}
