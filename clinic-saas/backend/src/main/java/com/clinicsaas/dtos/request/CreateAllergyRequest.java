package com.clinicsaas.dtos.request;

import com.clinicsaas.entities.enums.AllergenType;
import com.clinicsaas.entities.enums.AllergySeverity;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record CreateAllergyRequest(
        @NotNull UUID patientId,
        @NotNull AllergenType allergenType,
        @NotBlank String allergenName,
        String reaction,
        AllergySeverity severity,
        String notes
) {}
