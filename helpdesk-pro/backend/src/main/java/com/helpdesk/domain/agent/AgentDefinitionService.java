package com.helpdesk.domain.agent;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AgentDefinitionService {

    private static final List<String> TICKET_CATEGORIES =
            List.of("technical", "billing", "account", "feature_request", "other");

    private final AgentDefinitionRepository repository;
    private final AgentCapabilityDefinitionRepository capabilityRepository;
    private final List<AgentCapabilityHandler> capabilityHandlers;
    private final ObjectMapper objectMapper;

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
        return TICKET_CATEGORIES;
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
