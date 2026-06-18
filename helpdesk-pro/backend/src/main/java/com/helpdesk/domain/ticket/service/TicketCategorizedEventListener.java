package com.helpdesk.domain.ticket.service;

import com.helpdesk.domain.agent.AgentDefinition;
import com.helpdesk.domain.agent.AgentDefinitionRepository;
import com.helpdesk.domain.agent.AgentEngineService;
import com.helpdesk.domain.ticket.event.TicketCategorizedEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.util.List;

@Component
@RequiredArgsConstructor
public class TicketCategorizedEventListener {

    private final AgentDefinitionRepository agentDefinitionRepository;
    private final AgentEngineService agentEngineService;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onTicketCategorized(TicketCategorizedEvent event) {
        List<AgentDefinition> definitions = agentDefinitionRepository
                .findByActiveTrueAndTriggerCategoryIgnoreCase(event.category());
        for (AgentDefinition definition : definitions) {
            agentEngineService.process(event.ticketId(), definition.getId(), definition);
        }
    }
}
