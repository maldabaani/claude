package com.clinicsaas.services;

import com.clinicsaas.dtos.request.CreateDiagnosisRequest;
import com.clinicsaas.dtos.response.DiagnosisResponse;
import com.clinicsaas.entities.tenant.Diagnosis;
import com.clinicsaas.entities.tenant.Visit;
import com.clinicsaas.exceptions.ResourceNotFoundException;
import com.clinicsaas.repositories.tenant.DiagnosisRepository;
import com.clinicsaas.repositories.tenant.VisitRepository;
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
public class DiagnosisService {

    private final DiagnosisRepository diagnosisRepository;
    private final VisitRepository visitRepository;

    @Transactional("tenantTransactionManager")
    public DiagnosisResponse addDiagnosis(CreateDiagnosisRequest req, UUID diagnosedBy) {
        Visit visit = visitRepository.findById(req.visitId())
                .orElseThrow(() -> new ResourceNotFoundException("Visit", req.visitId()));

        Diagnosis diagnosis = Diagnosis.builder()
                .visit(visit)
                .patientId(req.patientId())
                .diagnosedBy(diagnosedBy)
                .diagnosisType(req.diagnosisType())
                .icdCode(req.icdCode())
                .icdDescription(req.icdDescription())
                .clinicalDescription(req.clinicalDescription())
                .chronic(req.chronic())
                .build();

        DiagnosisResponse response = DiagnosisResponse.from(diagnosisRepository.save(diagnosis));
        log.debug("Added diagnosis icdCode={} for visit id={}", req.icdCode(), req.visitId());
        return response;
    }

    @Transactional(value = "tenantTransactionManager", readOnly = true)
    public List<DiagnosisResponse> listByVisit(UUID visitId) {
        return diagnosisRepository.findByVisitIdOrderByCreatedAtAsc(visitId).stream()
                .map(DiagnosisResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional("tenantTransactionManager")
    public void delete(UUID id) {
        if (!diagnosisRepository.existsById(id)) {
            throw new ResourceNotFoundException("Diagnosis", id);
        }
        diagnosisRepository.deleteById(id);
        log.debug("Deleted diagnosis id={}", id);
    }
}
