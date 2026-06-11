package com.helpdesk.domain.automation;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AutomationRuleService {

    private final AutomationRuleRepository repository;

    public List<AutomationRule> getAll() {
        return repository.findByDeletedFalse();
    }

    @Transactional
    public AutomationRule create(AutomationRule rule) {
        rule.setCreatedAt(Instant.now());
        rule.setUpdatedAt(Instant.now());
        return repository.save(rule);
    }

    @Transactional
    public AutomationRule update(Long id, AutomationRule updated) {
        AutomationRule rule = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Automation rule not found: " + id));
        rule.setName(updated.getName());
        rule.setActive(updated.isActive());
        rule.setTriggerType(updated.getTriggerType());
        rule.setTriggerEvent(updated.getTriggerEvent());
        rule.setTriggerHours(updated.getTriggerHours());
        rule.setConditions(updated.getConditions());
        rule.setActions(updated.getActions());
        rule.setRunOrder(updated.getRunOrder());
        rule.setUpdatedAt(Instant.now());
        return repository.save(rule);
    }

    @Transactional
    public AutomationRule toggle(Long id) {
        AutomationRule rule = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Automation rule not found: " + id));
        rule.setActive(!rule.isActive());
        rule.setUpdatedAt(Instant.now());
        return repository.save(rule);
    }

    @Transactional
    public void delete(Long id) {
        repository.findById(id).ifPresent(r -> {
            r.setDeleted(true);
            r.setUpdatedAt(Instant.now());
            repository.save(r);
        });
    }
}
