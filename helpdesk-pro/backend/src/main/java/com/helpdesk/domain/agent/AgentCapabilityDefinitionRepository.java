package com.helpdesk.domain.agent;

import org.springframework.data.jpa.repository.JpaRepository;

public interface AgentCapabilityDefinitionRepository extends JpaRepository<AgentCapabilityDefinition, Long> {
    boolean existsByKeyIgnoreCase(String key);
}
