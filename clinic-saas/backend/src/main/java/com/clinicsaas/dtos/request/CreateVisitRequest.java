package com.clinicsaas.dtos.request;

import com.clinicsaas.entities.enums.VisitType;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record CreateVisitRequest(
        @NotNull UUID patientId,
        @NotNull VisitType visitType,
        UUID appointmentId,
        String chiefComplaint
) {}
