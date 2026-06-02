package com.clinicsaas.dtos.response;

import com.clinicsaas.entities.enums.ImagingModality;
import com.clinicsaas.entities.enums.LabOrderPriority;
import com.clinicsaas.entities.enums.RadiologyOrderStatus;
import com.clinicsaas.entities.tenant.RadiologyOrder;

import java.time.LocalDateTime;
import java.util.UUID;

public record RadiologyOrderResponse(
        UUID id,
        UUID visitId,
        UUID patientId,
        UUID orderedBy,
        String orderNumber,
        ImagingModality modality,
        String bodyPart,
        String laterality,
        String clinicalIndication,
        RadiologyOrderStatus status,
        LabOrderPriority priority,
        LocalDateTime scheduledAt,
        LocalDateTime performedAt,
        String notes,
        LocalDateTime createdAt,
        RadiologyReportResponse report
) {
    public static RadiologyOrderResponse from(RadiologyOrder order, RadiologyReportResponse report) {
        return new RadiologyOrderResponse(
                order.getId(),
                order.getVisit().getId(),
                order.getPatientId(),
                order.getOrderedBy(),
                order.getOrderNumber(),
                order.getModality(),
                order.getBodyPart(),
                order.getLaterality(),
                order.getClinicalIndication(),
                order.getStatus(),
                order.getPriority(),
                order.getScheduledAt(),
                order.getPerformedAt(),
                order.getNotes(),
                order.getCreatedAt(),
                report
        );
    }
}
