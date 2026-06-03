package com.clinicsaas.dtos.request;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record CreateInvoiceRequest(
        @NotNull UUID patientId,
        UUID visitId,
        LocalDate dueDate,
        String notes,
        @NotEmpty List<InvoiceItemRequest> items,
        UUID insurancePolicyId
) {}
