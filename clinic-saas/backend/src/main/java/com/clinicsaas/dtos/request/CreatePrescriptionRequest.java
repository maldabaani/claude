package com.clinicsaas.dtos.request;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record CreatePrescriptionRequest(
        @NotNull UUID visitId,
        LocalDate validUntil,
        String notes,
        @NotEmpty List<PrescriptionItemRequest> items
) {}
