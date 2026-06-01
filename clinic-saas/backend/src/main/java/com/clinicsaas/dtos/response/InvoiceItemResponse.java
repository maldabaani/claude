package com.clinicsaas.dtos.response;

import com.clinicsaas.entities.enums.ServiceType;
import com.clinicsaas.entities.tenant.InvoiceItem;

import java.math.BigDecimal;
import java.util.UUID;

public record InvoiceItemResponse(
        UUID id,
        ServiceType serviceType,
        String description,
        UUID referenceId,
        BigDecimal quantity,
        BigDecimal unitPrice,
        BigDecimal discountAmount,
        BigDecimal totalPrice
) {
    public static InvoiceItemResponse from(InvoiceItem item) {
        return new InvoiceItemResponse(
                item.getId(),
                item.getServiceType(),
                item.getDescription(),
                item.getReferenceId(),
                item.getQuantity(),
                item.getUnitPrice(),
                item.getDiscountAmount(),
                item.getTotalPrice()
        );
    }
}
