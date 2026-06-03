package com.clinicsaas.services;

import com.clinicsaas.dtos.request.CreateInsurancePayerRequest;
import com.clinicsaas.dtos.request.CreateInsurancePolicyRequest;
import com.clinicsaas.dtos.response.InsurancePayerResponse;
import com.clinicsaas.dtos.response.InsurancePolicyResponse;
import com.clinicsaas.entities.tenant.InsurancePayer;
import com.clinicsaas.entities.tenant.InsurancePolicy;
import com.clinicsaas.exceptions.ResourceNotFoundException;
import com.clinicsaas.repositories.tenant.InsurancePayerRepository;
import com.clinicsaas.repositories.tenant.InsurancePolicyRepository;
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
public class InsurancePolicyService {

    private final InsurancePayerRepository insurancePayerRepository;
    private final InsurancePolicyRepository insurancePolicyRepository;
    private final PatientRepository patientRepository;

    @Transactional(value = "tenantTransactionManager", readOnly = true)
    public List<InsurancePayerResponse> listPayers() {
        log.debug("Listing all active insurance payers");
        return insurancePayerRepository.findByActiveTrueOrderByNameAsc().stream()
                .map(InsurancePayerResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional("tenantTransactionManager")
    public InsurancePayerResponse createPayer(CreateInsurancePayerRequest req) {
        log.debug("Creating insurance payer: {}", req.name());
        InsurancePayer payer = InsurancePayer.builder()
                .name(req.name())
                .shortCode(req.shortCode().toUpperCase())
                .contactEmail(req.contactEmail())
                .portalUrl(req.portalUrl())
                .active(true)
                .build();
        InsurancePayer saved = insurancePayerRepository.save(payer);
        log.debug("Created insurance payer {} with id {}", saved.getName(), saved.getId());
        return InsurancePayerResponse.from(saved);
    }

    @Transactional("tenantTransactionManager")
    public InsurancePolicyResponse createPolicy(CreateInsurancePolicyRequest req) {
        log.debug("Creating insurance policy for patient {} with payer {}", req.patientId(), req.payerId());
        var patient = patientRepository.findById(req.patientId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient", req.patientId()));
        var payer = insurancePayerRepository.findById(req.payerId())
                .orElseThrow(() -> new ResourceNotFoundException("InsurancePayer", req.payerId()));

        InsurancePolicy policy = InsurancePolicy.builder()
                .patient(patient)
                .payer(payer)
                .insurerName(payer.getName())
                .policyNumber(req.policyNumber())
                .memberNumber(req.memberNumber())
                .groupNumber(req.groupNumber())
                .coverageType(req.coverageType())
                .validFrom(req.validFrom())
                .validTo(req.validTo())
                .copayAmount(req.copayAmount())
                .deductibleAmount(req.deductibleAmount())
                .coveragePercentage(req.coveragePercentage())
                .notes(req.notes())
                .active(true)
                .build();

        InsurancePolicy saved = insurancePolicyRepository.save(policy);
        log.debug("Created insurance policy {} for patient {}", saved.getPolicyNumber(), req.patientId());
        return InsurancePolicyResponse.from(saved);
    }

    @Transactional(value = "tenantTransactionManager", readOnly = true)
    public List<InsurancePolicyResponse> listByPatient(UUID patientId) {
        log.debug("Listing insurance policies for patient {}", patientId);
        return insurancePolicyRepository.findByPatient_IdOrderByCreatedAtDesc(patientId).stream()
                .map(InsurancePolicyResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional("tenantTransactionManager")
    public void deactivate(UUID policyId) {
        log.debug("Deactivating insurance policy {}", policyId);
        InsurancePolicy policy = insurancePolicyRepository.findById(policyId)
                .orElseThrow(() -> new ResourceNotFoundException("InsurancePolicy", policyId));
        policy.setActive(false);
        insurancePolicyRepository.save(policy);
    }

    @Transactional(value = "tenantTransactionManager", readOnly = true)
    public InsurancePolicyResponse getById(UUID id) {
        log.debug("Fetching insurance policy {}", id);
        InsurancePolicy policy = insurancePolicyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("InsurancePolicy", id));
        return InsurancePolicyResponse.from(policy);
    }
}
