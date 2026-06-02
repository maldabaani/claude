package com.clinicsaas.repositories.tenant;

import com.clinicsaas.entities.enums.AppointmentStatus;
import com.clinicsaas.entities.tenant.Appointment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface AppointmentRepository extends JpaRepository<Appointment, UUID> {
    Page<Appointment> findByDoctorId(UUID doctorId, Pageable pageable);
    Page<Appointment> findByPatientId(UUID patientId, Pageable pageable);
    List<Appointment> findByDoctorIdAndScheduledAtBetween(UUID doctorId, LocalDateTime from, LocalDateTime to);
    List<Appointment> findByScheduledAtBetween(LocalDateTime from, LocalDateTime to);
    boolean existsByDoctorIdAndScheduledAtAndStatusNot(UUID doctorId, LocalDateTime scheduledAt, AppointmentStatus status);
    long countByScheduledAtBetween(LocalDateTime start, LocalDateTime end);
}
