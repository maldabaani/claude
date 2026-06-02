package com.clinicsaas.dtos.request;

import com.clinicsaas.entities.enums.ServiceType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.UUID;

public record InvoiceItemRequest(
        @NotNull ServiceType serviceType,
        @NotBlank String description,
        UUID referenceId,
        @NotNull BigDecimal quantity,
        @NotNull BigDecimal unitPrice,
        BigDecimal discountAmount
) {}
