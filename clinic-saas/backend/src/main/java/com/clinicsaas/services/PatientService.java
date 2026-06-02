package com.clinicsaas.services;

import com.clinicsaas.dtos.request.CreatePatientRequest;
import com.clinicsaas.dtos.response.PatientResponse;
import com.clinicsaas.entities.tenant.Patient;
import com.clinicsaas.exceptions.ResourceNotFoundException;
import com.clinicsaas.pii.AuditAccess;
import com.clinicsaas.repositories.tenant.PatientRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PatientService {

    private final PatientRepository patientRepository;

    @AuditAccess(action = "PATIENT_CREATE", resourceType = "PATIENT")
    @Transactional("tenantTransactionManager")
    public PatientResponse create(CreatePatientRequest req) {
        Patient patient = Patient.builder()
                .medicalRecordNumber(generateMrn())
                .firstName(req.firstName())
                .lastName(req.lastName())
                .dateOfBirth(req.dateOfBirth())
                .gender(req.gender())
                .phone(req.phone())
                .email(req.email())
                .addressLine1(req.addressLine1())
                .city(req.city())
                .country(req.country())
                .emergencyContactName(req.emergencyContactName())
                .emergencyContactPhone(req.emergencyContactPhone())
                .bloodType(req.bloodType())
                .allergies(req.allergies())
                .build();
        return PatientResponse.from(patientRepository.save(patient));
    }

    @AuditAccess(action = "PATIENT_SEARCH", resourceType = "PATIENT")
    @Transactional(value = "tenantTransactionManager", readOnly = true)
    public Page<PatientResponse> search(String query, Pageable pageable) {
        if (query == null || query.isBlank()) {
            return patientRepository.findAll(pageable).map(PatientResponse::from);
        }
        return patientRepository.search(query, pageable).map(PatientResponse::from);
    }

    @AuditAccess(action = "PATIENT_VIEW", resourceType = "PATIENT")
    @Transactional(value = "tenantTransactionManager", readOnly = true)
    public PatientResponse getById(UUID id) {
        return patientRepository.findById(id)
                .map(PatientResponse::from)
                .orElseThrow(() -> new ResourceNotFoundException("Patient", id));
    }

    @AuditAccess(action = "PATIENT_DEACTIVATE", resourceType = "PATIENT")
    @Transactional("tenantTransactionManager")
    public void deactivate(UUID id) {
        Patient patient = patientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Patient", id));
        patient.setActive(false);
        patientRepository.save(patient);
    }

    private String generateMrn() {
        return "MRN-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }
}
