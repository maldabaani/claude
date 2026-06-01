package com.clinicsaas.dtos.request;

import com.clinicsaas.entities.enums.PaymentMethod;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record AddPaymentRequest(
        @NotNull BigDecimal amount,
        @NotNull PaymentMethod paymentMethod,
        String transactionReference,
        String notes
) {}
