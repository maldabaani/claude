package com.helpdesk.domain.slaescalation;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface SlaEscalationRuleRepository extends JpaRepository<SlaEscalationRule, UUID> {
    List<SlaEscalationRule> findByActiveTrue();
}
