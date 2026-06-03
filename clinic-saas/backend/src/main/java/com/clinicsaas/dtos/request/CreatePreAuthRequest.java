package com.clinicsaas.dtos.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.UUID;

public record CreatePreAuthRequest(
        @NotNull UUID patientId,
        @NotNull UUID insurancePolicyId,
        UUID visitId,
        @NotBlank String serviceDescription,
        String icdCode,
        BigDecimal estimatedAmount,
        String notes
) {}
