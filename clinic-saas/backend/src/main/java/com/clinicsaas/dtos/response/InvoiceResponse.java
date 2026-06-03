package com.clinicsaas.dtos.response;

import com.clinicsaas.entities.enums.InvoiceStatus;
import com.clinicsaas.entities.tenant.Invoice;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record InvoiceResponse(
        UUID id,
        UUID patientId,
        UUID visitId,
        String invoiceNumber,
        InvoiceStatus status,
        BigDecimal subtotal,
        BigDecimal taxAmount,
        BigDecimal discountAmount,
        BigDecimal totalAmount,
        BigDecimal paidAmount,
        LocalDate dueDate,
        LocalDateTime issuedAt,
        LocalDateTime paidAt,
        LocalDateTime createdAt,
        UUID insurancePolicyId,
        BigDecimal patientLiabilityAmount,
        BigDecimal insuranceLiabilityAmount,
        List<InvoiceItemResponse> items,
        List<PaymentResponse> payments
) {
    public static InvoiceResponse from(Invoice inv, List<InvoiceItemResponse> items, List<PaymentResponse> payments) {
        return new InvoiceResponse(
                inv.getId(),
                inv.getPatientId(),
                inv.getVisitId(),
                inv.getInvoiceNumber(),
                inv.getStatus(),
                inv.getSubtotal(),
                inv.getTaxAmount(),
                inv.getDiscountAmount(),
                inv.getTotalAmount(),
                inv.getPaidAmount(),
                inv.getDueDate(),
                inv.getIssuedAt(),
                inv.getPaidAt(),
                inv.getCreatedAt(),
                inv.getInsurancePolicyId(),
                inv.getPatientLiabilityAmount(),
                inv.getInsuranceLiabilityAmount(),
                items,
                payments
        );
    }
}
