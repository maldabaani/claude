package com.clinicsaas.services;

import com.clinicsaas.dtos.request.CreateMedicalHistoryRequest;
import com.clinicsaas.dtos.response.MedicalHistoryResponse;
import com.clinicsaas.entities.enums.MedicalHistoryStatus;
import com.clinicsaas.entities.tenant.MedicalHistory;
import com.clinicsaas.entities.tenant.Patient;
import com.clinicsaas.exceptions.ResourceNotFoundException;
import com.clinicsaas.repositories.tenant.MedicalHistoryRepository;
import com.clinicsaas.repositories.tenant.PatientRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class MedicalHistoryService {

    private final MedicalHistoryRepository medicalHistoryRepository;
    private final PatientRepository patientRepository;

    @Transactional("tenantTransactionManager")
    public MedicalHistoryResponse add(CreateMedicalHistoryRequest req) {
        Patient patient = patientRepository.findById(req.patientId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient", req.patientId()));

        MedicalHistoryStatus status = req.status() != null ? req.status() : MedicalHistoryStatus.ACTIVE;

        MedicalHistory history = MedicalHistory.builder()
                .patient(patient)
                .historyType(req.historyType())
                .conditionName(req.conditionName())
                .icdCode(req.icdCode())
                .status(status)
                .onsetDate(req.onsetDate())
                .notes(req.notes())
                .build();

        MedicalHistoryResponse response = MedicalHistoryResponse.from(medicalHistoryRepository.save(history));
        log.debug("Added medical history {} for patient id={}", req.conditionName(), req.patientId());
        return response;
    }

    @Transactional(value = "tenantTransactionManager", readOnly = true)
    public List<MedicalHistoryResponse> listByPatient(UUID patientId) {
        return medicalHistoryRepository.findByPatient_IdOrderByOnsetDateDesc(patientId).stream()
                .map(MedicalHistoryResponse::from)
                .collect(Collectors.toList());
    }
}
