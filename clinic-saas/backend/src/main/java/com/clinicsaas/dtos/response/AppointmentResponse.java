package com.clinicsaas.dtos.response;

import com.clinicsaas.entities.enums.AppointmentStatus;
import com.clinicsaas.entities.tenant.Appointment;

import java.time.LocalDateTime;
import java.util.UUID;

public record AppointmentResponse(
        UUID id,
        UUID patientId,
        UUID doctorId,
        LocalDateTime scheduledAt,
        int durationMinutes,
        AppointmentStatus status,
        String appointmentType,
        String notes
) {
    public static AppointmentResponse from(Appointment a) {
        return new AppointmentResponse(a.getId(), a.getPatientId(), a.getDoctorId(),
                a.getScheduledAt(), a.getDurationMinutes(), a.getStatus(),
                a.getAppointmentType(), a.getNotes());
    }
}
