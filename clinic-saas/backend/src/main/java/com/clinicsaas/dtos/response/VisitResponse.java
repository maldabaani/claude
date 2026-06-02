package com.clinicsaas.dtos.response;

import com.clinicsaas.entities.enums.VisitStatus;
import com.clinicsaas.entities.enums.VisitType;
import com.clinicsaas.entities.tenant.Visit;

import java.time.LocalDateTime;
import java.util.UUID;

public record VisitResponse(
        UUID id,
        UUID patientId,
        UUID doctorId,
        UUID appointmentId,
        VisitType visitType,
        VisitStatus status,
        String chiefComplaint,
        String clinicalNotes,
        LocalDateTime checkedInAt,
        LocalDateTime checkedOutAt,
        LocalDateTime createdAt
) {
    public static VisitResponse from(Visit v) {
        return new VisitResponse(
                v.getId(),
                v.getPatient().getId(),
                v.getDoctorId(),
                v.getAppointmentId(),
                v.getVisitType(),
                v.getStatus(),
                v.getChiefComplaint(),
                v.getClinicalNotes(),
                v.getCheckedInAt(),
                v.getCheckedOutAt(),
                v.getCreatedAt()
        );
    }
}
