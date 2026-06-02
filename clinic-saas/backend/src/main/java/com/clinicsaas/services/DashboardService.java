package com.clinicsaas.services;

import com.clinicsaas.dtos.response.DashboardStatsResponse;
import com.clinicsaas.entities.enums.VisitStatus;
import com.clinicsaas.repositories.tenant.AppointmentRepository;
import com.clinicsaas.repositories.tenant.PatientRepository;
import com.clinicsaas.repositories.tenant.VisitRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final PatientRepository patientRepository;
    private final AppointmentRepository appointmentRepository;
    private final VisitRepository visitRepository;

    @Transactional(value = "tenantTransactionManager", readOnly = true)
    public DashboardStatsResponse getStats() {
        long totalPatients = patientRepository.count();

        LocalDate today = LocalDate.now();
        LocalDateTime startOfDay = today.atStartOfDay();
        LocalDateTime startOfTomorrow = today.plusDays(1).atStartOfDay();
        long todayAppts = appointmentRepository.countByScheduledAtBetween(startOfDay, startOfTomorrow);

        long activeVisits = visitRepository.countByStatus(VisitStatus.IN_PROGRESS);
        long completedToday = visitRepository.countByStatus(VisitStatus.COMPLETED);

        return new DashboardStatsResponse(totalPatients, todayAppts, activeVisits, completedToday);
    }
}
