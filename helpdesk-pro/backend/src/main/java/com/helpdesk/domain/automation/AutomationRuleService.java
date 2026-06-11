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
        rule.setDeleted(false);
        return repository.save(rule);
    }

    @Transactional
    public AutomationRule update(Long id, AutomationRule updated) {
        AutomationRule existing = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Automation rule not found: " + id));
        existing.setName(updated.getName());
        existing.setActive(updated.isActive());
        existing.setTriggerType(updated.getTriggerType());
        existing.setTriggerEvent(updated.getTriggerEvent());
        existing.setTriggerHours(updated.getTriggerHours());
        existing.setConditions(updated.getConditions());
        existing.setActions(updated.getActions());
        existing.setRunOrder(updated.getRunOrder());
        existing.setUpdatedAt(Instant.now());
        return repository.save(existing);
    }

    @Transactional
    public void delete(Long id) {
        repository.findById(id).ifPresent(rule -> {
            rule.setDeleted(true);
            rule.setUpdatedAt(Instant.now());
            repository.save(rule);
        });
    }

    @Transactional
    public AutomationRule toggle(Long id) {
        AutomationRule rule = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Automation rule not found: " + id));
        rule.setActive(!rule.isActive());
        rule.setUpdatedAt(Instant.now());
        return repository.save(rule);
    }
}
