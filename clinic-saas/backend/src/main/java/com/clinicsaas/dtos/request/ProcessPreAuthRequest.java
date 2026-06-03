package com.clinicsaas.dtos.request;

import com.clinicsaas.entities.enums.PreAuthorizationStatus;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record ProcessPreAuthRequest(
        @NotNull PreAuthorizationStatus status,
        String approvalNumber,
        LocalDate validUntil,
        String rejectionReason,
        String notes
) {}
