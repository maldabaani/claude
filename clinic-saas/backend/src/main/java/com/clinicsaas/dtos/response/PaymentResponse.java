package com.clinicsaas.dtos.response;

import com.clinicsaas.entities.enums.PaymentMethod;
import com.clinicsaas.entities.tenant.Payment;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public record PaymentResponse(
        UUID id,
        String paymentNumber,
        BigDecimal amount,
        PaymentMethod paymentMethod,
        String transactionReference,
        LocalDateTime paidAt,
        String notes
) {
    public static PaymentResponse from(Payment p) {
        return new PaymentResponse(
                p.getId(),
                p.getPaymentNumber(),
                p.getAmount(),
                p.getPaymentMethod(),
                p.getTransactionReference(),
                p.getPaidAt(),
                p.getNotes()
        );
    }
}
