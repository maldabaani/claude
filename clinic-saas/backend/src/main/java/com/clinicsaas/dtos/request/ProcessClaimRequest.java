package com.clinicsaas.dtos.request;

import com.clinicsaas.entities.enums.InsuranceClaimStatus;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record ProcessClaimRequest(
        @NotNull InsuranceClaimStatus status,
        BigDecimal approvedAmount,
        BigDecimal rejectedAmount,
        String rejectionReason,
        String notes
) {}
