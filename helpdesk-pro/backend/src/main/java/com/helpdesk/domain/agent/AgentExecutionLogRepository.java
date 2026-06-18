package com.helpdesk.domain.agent;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface AgentExecutionLogRepository extends JpaRepository<AgentExecutionLog, Long> {
    boolean existsByTicketIdAndAgentDefinitionId(UUID ticketId, Long agentDefinitionId);
}
