package com.clinicsaas.dtos.response;

import com.clinicsaas.entities.enums.PrescriptionStatus;
import com.clinicsaas.entities.tenant.Prescription;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record PrescriptionResponse(
        UUID id,
        UUID visitId,
        UUID patientId,
        String prescriptionNumber,
        PrescriptionStatus status,
        LocalDate validUntil,
        String notes,
        LocalDateTime createdAt,
        List<PrescriptionItemResponse> items
) {
    public static PrescriptionResponse from(Prescription p, List<PrescriptionItemResponse> items) {
        return new PrescriptionResponse(
                p.getId(),
                p.getVisit().getId(),
                p.getPatientId(),
                p.getPrescriptionNumber(),
                p.getStatus(),
                p.getValidUntil(),
                p.getNotes(),
                p.getCreatedAt(),
                items
        );
    }
}
