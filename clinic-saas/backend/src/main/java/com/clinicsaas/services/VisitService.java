package com.clinicsaas.services;

import com.clinicsaas.dtos.request.CreateVisitRequest;
import com.clinicsaas.dtos.request.UpdateVitalSignsRequest;
import com.clinicsaas.dtos.response.VisitResponse;
import com.clinicsaas.entities.enums.VisitStatus;
import com.clinicsaas.entities.tenant.Patient;
import com.clinicsaas.entities.tenant.Visit;
import com.clinicsaas.entities.tenant.VitalSigns;
import com.clinicsaas.exceptions.ResourceNotFoundException;
import com.clinicsaas.repositories.tenant.PatientRepository;
import com.clinicsaas.repositories.tenant.VitalSignsRepository;
import com.clinicsaas.repositories.tenant.VisitRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class VisitService {

    private final VisitRepository visitRepository;
    private final PatientRepository patientRepository;
    private final VitalSignsRepository vitalSignsRepository;

    @Transactional("tenantTransactionManager")
    public VisitResponse createVisit(CreateVisitRequest req, UUID doctorId) {
        Patient patient = patientRepository.findById(req.patientId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient", req.patientId()));
        Visit visit = Visit.builder()
                .patient(patient)
                .doctorId(doctorId)
                .appointmentId(req.appointmentId())
                .visitType(req.visitType())
                .status(VisitStatus.WAITING)
                .chiefComplaint(req.chiefComplaint())
                .checkedInAt(LocalDateTime.now())
                .build();
        return VisitResponse.from(visitRepository.save(visit));
    }

    @Transactional(value = "tenantTransactionManager", readOnly = true)
    public Page<VisitResponse> listByPatient(UUID patientId, Pageable pageable) {
        return visitRepository.findByPatientIdOrderByCreatedAtDesc(patientId, pageable)
                .map(VisitResponse::from);
    }

    @Transactional(value = "tenantTransactionManager", readOnly = true)
    public VisitResponse getById(UUID id) {
        return visitRepository.findById(id)
                .map(VisitResponse::from)
                .orElseThrow(() -> new ResourceNotFoundException("Visit", id));
    }

    @Transactional("tenantTransactionManager")
    public VisitResponse checkout(UUID id) {
        Visit visit = visitRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Visit", id));
        visit.setStatus(VisitStatus.COMPLETED);
        visit.setCheckedOutAt(LocalDateTime.now());
        return VisitResponse.from(visitRepository.save(visit));
    }

    @Transactional("tenantTransactionManager")
    public void recordVitals(UUID visitId, UpdateVitalSignsRequest req, UUID recordedBy) {
        Visit visit = visitRepository.findById(visitId)
                .orElseThrow(() -> new ResourceNotFoundException("Visit", visitId));

        VitalSigns vs = VitalSigns.builder()
                .visit(visit)
                .recordedBy(recordedBy)
                .bpSystolic(req.bpSystolic())
                .bpDiastolic(req.bpDiastolic())
                .heartRate(req.heartRate())
                .respiratoryRate(req.respiratoryRate())
                .temperature(req.temperature())
                .oxygenSaturation(req.oxygenSaturation())
                .weightKg(req.weightKg())
                .heightCm(req.heightCm())
                .bloodGlucose(req.bloodGlucose())
                .notes(req.notes())
                .build();

        if (req.weightKg() != null && req.heightCm() != null
                && req.heightCm().compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal heightM = req.heightCm().divide(new BigDecimal("100"), 4, java.math.RoundingMode.HALF_UP);
            BigDecimal bmi = req.weightKg().divide(heightM.multiply(heightM), 1, java.math.RoundingMode.HALF_UP);
            vs.setBmi(bmi);
        }

        vitalSignsRepository.save(vs);
        log.debug("Vitals recorded for visit {}", visitId);
    }
}
