package com.clinicsaas.services;

import com.clinicsaas.dtos.request.CreateAppointmentRequest;
import com.clinicsaas.dtos.response.AppointmentResponse;
import com.clinicsaas.entities.enums.AppointmentStatus;
import com.clinicsaas.entities.tenant.Appointment;
import com.clinicsaas.exceptions.BadRequestException;
import com.clinicsaas.exceptions.ResourceNotFoundException;
import com.clinicsaas.repositories.tenant.AppointmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;

    @Transactional("tenantTransactionManager")
    public AppointmentResponse create(CreateAppointmentRequest req) {
        if (appointmentRepository.existsByDoctorIdAndScheduledAtAndStatusNot(
                req.doctorId(), req.scheduledAt(), AppointmentStatus.CANCELLED)) {
            throw new BadRequestException("Doctor already has an appointment at this time");
        }
        Appointment appt = Appointment.builder()
                .patientId(req.patientId())
                .doctorId(req.doctorId())
                .scheduledAt(req.scheduledAt())
                .durationMinutes(req.durationMinutes() > 0 ? req.durationMinutes() : 30)
                .appointmentType(req.appointmentType())
                .notes(req.notes())
                .build();
        return AppointmentResponse.from(appointmentRepository.save(appt));
    }

    @Transactional(value = "tenantTransactionManager", readOnly = true)
    public Page<AppointmentResponse> getByDoctor(UUID doctorId, Pageable pageable) {
        return appointmentRepository.findByDoctorId(doctorId, pageable).map(AppointmentResponse::from);
    }

    @Transactional(value = "tenantTransactionManager", readOnly = true)
    public List<AppointmentResponse> getByDateRange(LocalDate from, LocalDate to) {
        LocalDateTime start = from.atStartOfDay();
        LocalDateTime end   = to.atTime(23, 59, 59);
        return appointmentRepository.findByScheduledAtBetween(start, end)
                .stream().map(AppointmentResponse::from).toList();
    }

    @Transactional("tenantTransactionManager")
    public AppointmentResponse updateStatus(UUID id, AppointmentStatus newStatus) {
        Appointment appt = appointmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment", id));
        appt.setStatus(newStatus);
        return AppointmentResponse.from(appointmentRepository.save(appt));
    }

    @Transactional(value = "tenantTransactionManager", readOnly = true)
    public AppointmentResponse getById(UUID id) {
        return appointmentRepository.findById(id)
                .map(AppointmentResponse::from)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment", id));
    }
}
