package com.helpdesk.domain.ticket.service;

import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class PresenceService {

    private static final long EXPIRY_SECONDS = 30;

    // ticketId -> (agentId -> { name, lastSeen })
    private final ConcurrentHashMap<UUID, ConcurrentHashMap<UUID, AgentPresence>> presenceMap = new ConcurrentHashMap<>();

    public void recordPresence(UUID ticketId, UUID agentId, String agentName) {
        presenceMap.computeIfAbsent(ticketId, k -> new ConcurrentHashMap<>())
                   .put(agentId, new AgentPresence(agentId, agentName, Instant.now()));
    }

    public List<AgentPresence> getPresence(UUID ticketId) {
        ConcurrentHashMap<UUID, AgentPresence> agents = presenceMap.get(ticketId);
        if (agents == null) return List.of();

        Instant cutoff = Instant.now().minusSeconds(EXPIRY_SECONDS);
        List<AgentPresence> active = new ArrayList<>();
        for (Map.Entry<UUID, AgentPresence> entry : agents.entrySet()) {
            if (entry.getValue().lastSeen().isAfter(cutoff)) {
                active.add(entry.getValue());
            } else {
                agents.remove(entry.getKey());
            }
        }
        return active;
    }

    public record AgentPresence(UUID agentId, String agentName, Instant lastSeen) {}
}
