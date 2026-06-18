package com.helpdesk.domain.agent;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AgentDefinitionRepository extends JpaRepository<AgentDefinition, Long> {
    List<AgentDefinition> findByActiveTrueAndTriggerCategoryIgnoreCase(String triggerCategory);
}
