package com.helpdesk.domain.sla.service;

import com.helpdesk.domain.sla.entity.SlaPolicy;
import com.helpdesk.domain.sla.repository.SlaPolicyRepository;
import com.helpdesk.shared.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SlaPolicyService {

    private final SlaPolicyRepository slaPolicyRepository;

    public Page<SlaPolicy> findAll(Pageable pageable) {
        return slaPolicyRepository.findByDeletedAtIsNull(pageable);
    }

    public SlaPolicy findById(UUID id) {
        return slaPolicyRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new ResourceNotFoundException("SLA Policy", id));
    }

    @Transactional
    public SlaPolicy create(SlaPolicy policy) {
        return slaPolicyRepository.save(policy);
    }

    @Transactional
    public SlaPolicy update(UUID id, SlaPolicy request) {
        SlaPolicy policy = findById(id);
        policy.setName(request.getName());
        policy.setResponseTimeHours(request.getResponseTimeHours());
        policy.setResolutionTimeHours(request.getResolutionTimeHours());
        policy.setPriority(request.getPriority());
        policy.setBusinessHoursOnly(request.isBusinessHoursOnly());
        return slaPolicyRepository.save(policy);
    }

    @Transactional
    public void delete(UUID id) {
        SlaPolicy policy = findById(id);
        policy.softDelete();
        slaPolicyRepository.save(policy);
    }
}
