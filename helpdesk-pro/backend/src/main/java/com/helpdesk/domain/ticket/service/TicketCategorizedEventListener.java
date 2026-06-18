package com.helpdesk.domain.ticket.service;

import com.helpdesk.domain.agent.AgentDefinition;
import com.helpdesk.domain.agent.AgentDefinitionRepository;
import com.helpdesk.domain.agent.AgentEngineService;
import com.helpdesk.domain.ticket.event.TicketCategorizedEvent;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.util.List;

@Component
@RequiredArgsConstructor
public class TicketCategorizedEventListener {

    private static final Logger log = LoggerFactory.getLogger(TicketCategorizedEventListener.class);

    private final AgentDefinitionRepository agentDefinitionRepository;
    private final AgentEngineService agentEngineService;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onTicketCategorized(TicketCategorizedEvent event) {
        List<AgentDefinition> definitions = agentDefinitionRepository
                .findByActiveTrueAndTriggerCategoryIgnoreCase(event.category());
        log.debug("TicketCategorizedEvent received for ticket {} with category '{}' - matched {} active agent definition(s): {}",
                event.ticketId(), event.category(), definitions.size(),
                definitions.stream().map(AgentDefinition::getName).toList());
        for (AgentDefinition definition : definitions) {
            agentEngineService.process(event.ticketId(), definition.getId(), definition);
        }
    }
}
