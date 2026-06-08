package com.clinicsaas.services;

import com.clinicsaas.dtos.request.CreatePreAuthRequest;
import com.clinicsaas.dtos.request.ProcessPreAuthRequest;
import com.clinicsaas.dtos.response.PreAuthorizationResponse;
import com.clinicsaas.entities.enums.PreAuthorizationStatus;
import com.clinicsaas.entities.tenant.InsurancePolicy;
import com.clinicsaas.entities.tenant.PreAuthorization;
import com.clinicsaas.exceptions.ResourceNotFoundException;
import com.clinicsaas.repositories.tenant.InsurancePolicyRepository;
import com.clinicsaas.repositories.tenant.PreAuthorizationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class PreAuthorizationService {

    private final PreAuthorizationRepository preAuthorizationRepository;
    private final InsurancePolicyRepository insurancePolicyRepository;

    @Transactional("tenantTransactionManager")
    public PreAuthorizationResponse create(CreatePreAuthRequest req, UUID requestedBy) {
        log.debug("Creating pre-authorization for patient {} with policy {}", req.patientId(), req.insurancePolicyId());
        InsurancePolicy policy = insurancePolicyRepository.findById(req.insurancePolicyId())
                .orElseThrow(() -> new ResourceNotFoundException("InsurancePolicy", req.insurancePolicyId()));

        String preauthNumber = "PA-" + System.currentTimeMillis();

        PreAuthorization preAuth = PreAuthorization.builder()
                .patientId(req.patientId())
                .insurancePolicy(policy)
                .visitId(req.visitId())
                .preauthNumber(preauthNumber)
                .serviceDescription(req.serviceDescription())
                .icdCode(req.icdCode())
                .estimatedAmount(req.estimatedAmount())
                .notes(req.notes())
                .status(PreAuthorizationStatus.DRAFT)
                .requestedBy(requestedBy)
                .build();

        PreAuthorization saved = preAuthorizationRepository.save(preAuth);
        log.debug("Created pre-authorization {}", preauthNumber);
        return PreAuthorizationResponse.from(saved);
    }

    @Transactional("tenantTransactionManager")
    public PreAuthorizationResponse submit(UUID id) {
        log.debug("Submitting pre-authorization {}", id);
        PreAuthorization preAuth = preAuthorizationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("PreAuthorization", id));

        preAuth.setStatus(PreAuthorizationStatus.SUBMITTED);
        preAuth.setSubmittedAt(LocalDateTime.now());
        PreAuthorization saved = preAuthorizationRepository.save(preAuth);
        log.debug("Submitted pre-authorization {}", preAuth.getPreauthNumber());
        return PreAuthorizationResponse.from(saved);
    }

    @Transactional("tenantTransactionManager")
    public PreAuthorizationResponse processResult(UUID id, ProcessPreAuthRequest req) {
        log.debug("Processing result for pre-authorization {}, status={}", id, req.status());
        PreAuthorization preAuth = preAuthorizationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("PreAuthorization", id));

        preAuth.setStatus(req.status());
        preAuth.setApprovalNumber(req.approvalNumber());
        preAuth.setValidUntil(req.validUntil());
        preAuth.setRejectionReason(req.rejectionReason());
        if (req.notes() != null) {
            preAuth.setNotes(req.notes());
        }
        preAuth.setProcessedAt(LocalDateTime.now());

        PreAuthorization saved = preAuthorizationRepository.save(preAuth);
        log.debug("Processed pre-authorization {} with status {}", preAuth.getPreauthNumber(), req.status());
        return PreAuthorizationResponse.from(saved);
    }

    @Transactional(value = "tenantTransactionManager", readOnly = true)
    public List<PreAuthorizationResponse> listByPatient(UUID patientId) {
        log.debug("Listing pre-authorizations for patient {}", patientId);
        return preAuthorizationRepository.findByPatientIdOrderByCreatedAtDesc(patientId)
                .stream().map(PreAuthorizationResponse::from).collect(Collectors.toList());
    }

    @Transactional(value = "tenantTransactionManager", readOnly = true)
    public List<PreAuthorizationResponse> listAll(PreAuthorizationStatus statusFilter) {
        log.debug("Listing all pre-authorizations, statusFilter={}", statusFilter);
        List<PreAuthorization> list;
        if (statusFilter == null) {
            list = preAuthorizationRepository.findAll();
        } else {
            list = preAuthorizationRepository.findByStatusOrderByCreatedAtDesc(statusFilter);
        }
        return list.stream().map(PreAuthorizationResponse::from).collect(Collectors.toList());
    }

    @Transactional(value = "tenantTransactionManager", readOnly = true)
    public PreAuthorizationResponse getById(UUID id) {
        log.debug("Fetching pre-authorization {}", id);
        PreAuthorization preAuth = preAuthorizationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("PreAuthorization", id));
        return PreAuthorizationResponse.from(preAuth);
    }
}
