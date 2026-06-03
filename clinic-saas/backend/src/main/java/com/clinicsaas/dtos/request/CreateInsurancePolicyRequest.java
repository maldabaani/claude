package com.clinicsaas.dtos.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record CreateInsurancePolicyRequest(
        @NotNull UUID patientId,
        @NotNull UUID payerId,
        @NotBlank String policyNumber,
        String memberNumber,
        String groupNumber,
        String coverageType,
        LocalDate validFrom,
        LocalDate validTo,
        BigDecimal copayAmount,
        BigDecimal deductibleAmount,
        BigDecimal coveragePercentage,
        String notes
) {}
