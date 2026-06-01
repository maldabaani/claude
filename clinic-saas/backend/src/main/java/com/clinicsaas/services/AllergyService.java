package com.clinicsaas.services;

import com.clinicsaas.dtos.request.CreateAllergyRequest;
import com.clinicsaas.dtos.response.AllergyResponse;
import com.clinicsaas.entities.tenant.Allergy;
import com.clinicsaas.entities.tenant.Patient;
import com.clinicsaas.exceptions.ResourceNotFoundException;
import com.clinicsaas.repositories.tenant.AllergyRepository;
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
public class AllergyService {

    private final AllergyRepository allergyRepository;
    private final PatientRepository patientRepository;

    @Transactional("tenantTransactionManager")
    public AllergyResponse addAllergy(CreateAllergyRequest req) {
        Patient patient = patientRepository.findById(req.patientId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient", req.patientId()));

        Allergy allergy = Allergy.builder()
                .patient(patient)
                .allergenType(req.allergenType())
                .allergenName(req.allergenName())
                .reaction(req.reaction())
                .severity(req.severity())
                .notes(req.notes())
                .active(true)
                .build();

        AllergyResponse response = AllergyResponse.from(allergyRepository.save(allergy));
        log.debug("Added allergy {} for patient id={}", req.allergenName(), req.patientId());
        return response;
    }

    @Transactional(value = "tenantTransactionManager", readOnly = true)
    public List<AllergyResponse> listByPatient(UUID patientId) {
        return allergyRepository.findByPatient_IdAndActiveTrue(patientId).stream()
                .map(AllergyResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional("tenantTransactionManager")
    public void deactivate(UUID id) {
        Allergy allergy = allergyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Allergy", id));
        allergy.setActive(false);
        allergyRepository.save(allergy);
        log.debug("Deactivated allergy id={}", id);
    }
}
