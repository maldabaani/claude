package com.helpdesk.domain.agent;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.helpdesk.domain.comment.entity.Comment;
import com.helpdesk.domain.comment.repository.CommentRepository;
import com.helpdesk.domain.ticket.entity.Ticket;
import com.helpdesk.domain.ticket.entity.TicketStatus;
import com.helpdesk.domain.ticket.service.TicketService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AgentEngineService {

    private static final Logger log = LoggerFactory.getLogger(AgentEngineService.class);

    private static final UUID AI_AGENT_USER_ID = UUID.fromString("a0000000-0000-0000-0000-00000000a1ae");

    private final TicketService ticketService;
    private final CommentRepository commentRepository;
    private final AgentExecutionLogRepository executionLogRepository;
    private final List<AgentCapabilityHandler> capabilityHandlers;
    private final ObjectMapper objectMapper;

    private Map<AgentCapability, AgentCapabilityHandler> handlersByCapability;

    private Map<AgentCapability, AgentCapabilityHandler> handlers() {
        if (handlersByCapability == null) {
            handlersByCapability = capabilityHandlers.stream()
                    .collect(Collectors.toMap(AgentCapabilityHandler::getCapability, h -> h));
        }
        return handlersByCapability;
    }

    @Async("aiAgentExecutor")
    @Transactional
    public void process(UUID ticketId, Long agentDefinitionId, AgentDefinition definition) {
        try {
            if (executionLogRepository.existsByTicketIdAndAgentDefinitionId(ticketId, agentDefinitionId)) {
                return;
            }

            Ticket ticket = ticketService.getTicket(ticketId);
            if (ticket.isClosedByAi() || ticket.getStatus() == TicketStatus.CLOSED) {
                return;
            }
            if (!definition.getTriggerCategory().equalsIgnoreCase(ticket.getCategory())) {
                return;
            }
            if (!matchesKeywords(ticket, definition.getKeywords())) {
                log.info("AI agent '{}' skipping ticket {} - not a recognized intent", definition.getName(), ticket.getTicketNumber());
                logExecution(ticketId, agentDefinitionId, AgentExecutionOutcome.SKIPPED_OUT_OF_SCOPE, "Keyword guard did not match");
                return;
            }

            AgentCapabilityHandler handler = handlers().get(definition.getCapability());
            if (handler == null) {
                log.warn("No handler registered for capability {}", definition.getCapability());
                logExecution(ticketId, agentDefinitionId, AgentExecutionOutcome.FAILED, "No handler for capability " + definition.getCapability());
                return;
            }

            String commentBody = handler.execute(ticket);

            Comment comment = Comment.builder()
                    .ticketId(ticketId)
                    .authorId(AI_AGENT_USER_ID)
                    .body(commentBody)
                    .internal(false)
                    .build();
            commentRepository.save(comment);

            if (definition.isAutoClose()) {
                ticketService.closeByAi(ticketId);
            }

            logExecution(ticketId, agentDefinitionId, AgentExecutionOutcome.RESOLVED, null);
            log.info("AI agent '{}' resolved ticket {}", definition.getName(), ticket.getTicketNumber());
        } catch (Exception e) {
            log.warn("AI agent '{}' failed to process ticket {}: {}", definition.getName(), ticketId, e.getMessage());
            logExecution(ticketId, agentDefinitionId, AgentExecutionOutcome.FAILED, e.getMessage());
        }
    }

    private void logExecution(UUID ticketId, Long agentDefinitionId, AgentExecutionOutcome outcome, String detail) {
        executionLogRepository.save(AgentExecutionLog.builder()
                .ticketId(ticketId)
                .agentDefinitionId(agentDefinitionId)
                .outcome(outcome)
                .detail(detail)
                .build());
    }

    private boolean matchesKeywords(Ticket ticket, String keywordsJson) {
        List<String> keywords = parseKeywords(keywordsJson);
        if (keywords.isEmpty()) {
            return true;
        }
        String text = ((ticket.getTitle() != null ? ticket.getTitle() : "") + " " +
                (ticket.getDescription() != null ? ticket.getDescription() : "")).toLowerCase(Locale.ROOT);
        return keywords.stream().anyMatch(k -> text.contains(k.toLowerCase(Locale.ROOT)));
    }

    @SuppressWarnings("unchecked")
    private List<String> parseKeywords(String keywordsJson) {
        try {
            return objectMapper.readValue(keywordsJson, List.class);
        } catch (Exception e) {
            return List.of();
        }
    }
}
