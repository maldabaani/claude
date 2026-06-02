package com.clinicsaas.dtos.response;

import com.clinicsaas.entities.enums.LabOrderPriority;
import com.clinicsaas.entities.enums.LabOrderStatus;
import com.clinicsaas.entities.tenant.LabOrder;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record LabOrderResponse(
        UUID id,
        UUID visitId,
        UUID patientId,
        String orderNumber,
        LabOrderStatus status,
        LabOrderPriority priority,
        String clinicalIndication,
        LocalDateTime sampleCollectedAt,
        LocalDateTime resultedAt,
        LocalDateTime createdAt,
        List<LabOrderItemResponse> items
) {
    public static LabOrderResponse from(LabOrder order, List<LabOrderItemResponse> items) {
        return new LabOrderResponse(
                order.getId(),
                order.getVisit().getId(),
                order.getPatientId(),
                order.getOrderNumber(),
                order.getStatus(),
                order.getPriority(),
                order.getClinicalIndication(),
                order.getSampleCollectedAt(),
                order.getResultedAt(),
                order.getCreatedAt(),
                items
        );
    }
}
