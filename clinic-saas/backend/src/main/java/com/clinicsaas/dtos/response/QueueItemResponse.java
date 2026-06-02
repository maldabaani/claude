package com.clinicsaas.dtos.response;

import com.clinicsaas.entities.tenant.Visit;

import java.time.LocalDateTime;
import java.util.UUID;

public record QueueItemResponse(
        UUID id,
        String patientFirstName,
        String patientLastName,
        String patientMrn,
        UUID patientId,
        UUID doctorId,
        String visitType,
        String status,
        String chiefComplaint,
        LocalDateTime checkedInAt,
        LocalDateTime createdAt
) {
    public static QueueItemResponse from(Visit v) {
        return new QueueItemResponse(
                v.getId(),
                v.getPatient().getFirstName(),
                v.getPatient().getLastName(),
                v.getPatient().getMedicalRecordNumber(),
                v.getPatient().getId(),
                v.getDoctorId(),
                v.getVisitType().name(),
                v.getStatus().name(),
                v.getChiefComplaint(),
                v.getCheckedInAt(),
                v.getCreatedAt()
        );
    }
}
