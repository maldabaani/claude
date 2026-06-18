package com.helpdesk.domain.agent;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.helpdesk.domain.template.TicketTemplateRepository;
import com.helpdesk.domain.ticket.repository.TicketRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
public class AgentDefinitionService {

    private static final List<String> TICKET_CATEGORIES =
            List.of("technical", "billing", "account", "feature_request", "other");

    private final AgentDefinitionRepository repository;
    private final AgentCapabilityDefinitionRepository capabilityRepository;
    private final List<AgentCapabilityHandler> capabilityHandlers;
    private final ObjectMapper objectMapper;
    private final TicketTemplateRepository ticketTemplateRepository;
    private final TicketRepository ticketRepository;

    public List<AgentDefinitionResponse> getAll() {
        return repository.findAll().stream().map(this::toResponse).toList();
    }

    @Transactional
    public AgentDefinitionResponse create(AgentDefinitionRequest request) {
        AgentDefinition definition = AgentDefinition.builder()
                .name(request.name())
                .description(request.description())
                .triggerCategory(request.triggerCategory())
                .keywords(writeKeywords(request.keywords()))
                .capability(request.capability())
                .autoClose(request.autoClose())
                .active(request.active())
                .build();
        return toResponse(repository.save(definition));
    }

    @Transactional
    public AgentDefinitionResponse update(Long id, AgentDefinitionRequest request) {
        AgentDefinition definition = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Agent definition not found: " + id));
        definition.setName(request.name());
        definition.setDescription(request.description());
        definition.setTriggerCategory(request.triggerCategory());
        definition.setKeywords(writeKeywords(request.keywords()));
        definition.setCapability(request.capability());
        definition.setAutoClose(request.autoClose());
        definition.setActive(request.active());
        definition.setUpdatedAt(Instant.now());
        return toResponse(repository.save(definition));
    }

    @Transactional
    public AgentDefinitionResponse toggle(Long id) {
        AgentDefinition definition = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Agent definition not found: " + id));
        definition.setActive(!definition.isActive());
        definition.setUpdatedAt(Instant.now());
        return toResponse(repository.save(definition));
    }

    @Transactional
    public void delete(Long id) {
        repository.deleteById(id);
    }

    public List<AgentCapabilityResponse> getCapabilities() {
        Set<String> registeredKeys = capabilityHandlers.stream()
                .map(AgentCapabilityHandler::getCapabilityKey)
                .collect(Collectors.toSet());
        return capabilityRepository.findAll().stream()
                .map(c -> new AgentCapabilityResponse(c.getKey(), c.getLabel(), c.getDescription(),
                        registeredKeys.contains(c.getKey())))
                .toList();
    }

    @Transactional
    public AgentCapabilityResponse createCapability(AgentCapabilityRequest request) {
        String key = request.key().trim().toUpperCase().replace(' ', '_');
        if (capabilityRepository.existsByKeyIgnoreCase(key)) {
            throw new IllegalArgumentException("Capability already exists: " + key);
        }
        AgentCapabilityDefinition saved = capabilityRepository.save(AgentCapabilityDefinition.builder()
                .key(key)
                .label(request.label())
                .description(request.description())
                .build());
        boolean hasHandler = capabilityHandlers.stream()
                .anyMatch(h -> h.getCapabilityKey().equals(saved.getKey()));
        return new AgentCapabilityResponse(saved.getKey(), saved.getLabel(), saved.getDescription(), hasHandler);
    }

    public List<String> getTicketCategories() {
        // Canonical AI-triage categories first, then any distinct categories actually
        // used by ticket templates and existing tickets (e.g. "Hardware"). Deduped
        // case-insensitively so the agent trigger-category dropdown reflects reality.
        Map<String, String> byLower = new LinkedHashMap<>();
        for (String c : TICKET_CATEGORIES) {
            byLower.putIfAbsent(c.toLowerCase(Locale.ROOT), c);
        }
        Stream.concat(
                        ticketTemplateRepository.findDistinctCategories().stream(),
                        ticketRepository.findDistinctCategories().stream())
                .filter(c -> c != null && !c.isBlank())
                .sorted(String.CASE_INSENSITIVE_ORDER)
                .forEach(c -> byLower.putIfAbsent(c.toLowerCase(Locale.ROOT), c));
        return new ArrayList<>(byLower.values());
    }

    private AgentDefinitionResponse toResponse(AgentDefinition d) {
        return new AgentDefinitionResponse(
                d.getId(), d.getName(), d.getDescription(), d.getTriggerCategory(),
                readKeywords(d.getKeywords()), d.getCapability(), d.isAutoClose(), d.isActive(),
                d.getCreatedAt(), d.getUpdatedAt());
    }

    @SuppressWarnings("unchecked")
    private List<String> readKeywords(String json) {
        try {
            return objectMapper.readValue(json, List.class);
        } catch (Exception e) {
            return List.of();
        }
    }

    private String writeKeywords(List<String> keywords) {
        try {
            return objectMapper.writeValueAsString(keywords == null ? List.of() : keywords);
        } catch (Exception e) {
            return "[]";
        }
    }
}
