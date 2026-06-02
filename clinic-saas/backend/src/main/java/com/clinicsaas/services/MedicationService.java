package com.clinicsaas.services;

import com.clinicsaas.dtos.response.MedicationResponse;
import com.clinicsaas.repositories.tenant.MedicationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class MedicationService {

    private final MedicationRepository medicationRepository;

    @Transactional(value = "tenantTransactionManager", readOnly = true)
    public List<MedicationResponse> listActive() {
        return medicationRepository.findAll().stream()
                .filter(m -> m.isActive())
                .map(MedicationResponse::from)
                .collect(Collectors.toList());
    }
}
