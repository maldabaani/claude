package com.helpdesk.domain.agent;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "agent_execution_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AgentExecutionLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ticket_id", nullable = false)
    private UUID ticketId;

    @Column(name = "agent_definition_id", nullable = false)
    private Long agentDefinitionId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AgentExecutionOutcome outcome;

    private String detail;

    @Column(name = "executed_at")
    @Builder.Default
    private Instant executedAt = Instant.now();
}
