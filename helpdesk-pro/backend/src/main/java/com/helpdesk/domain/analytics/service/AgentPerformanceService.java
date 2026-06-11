package com.helpdesk.domain.analytics.service;

import com.helpdesk.domain.analytics.dto.AgentPerformanceDto;
import com.helpdesk.domain.csat.repository.CsatRatingRepository;
import com.helpdesk.domain.ticket.repository.TicketRepository;
import com.helpdesk.domain.user.entity.Role;
import com.helpdesk.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AgentPerformanceService {

    private final UserRepository userRepository;
    private final TicketRepository ticketRepository;
    private final CsatRatingRepository csatRatingRepository;

    public List<AgentPerformanceDto> getAllAgentMetrics(Instant from, Instant to) {
        return userRepository.findAll().stream()
            .filter(u -> u.getRole() == Role.AGENT || u.getRole() == Role.TEAM_LEAD)
            .filter(u -> u.getDeletedAt() == null)
            .map(u -> buildMetrics(u.getId(), u.getFullName(), u.getEmail(),
                    u.getAvailabilityStatus().name(), from, to))
            .toList();
    }

    public AgentPerformanceDto getAgentMetrics(UUID agentId, Instant from, Instant to) {
        var user = userRepository.findById(agentId)
            .orElseThrow(() -> new IllegalArgumentException("Agent not found: " + agentId));
        return buildMetrics(agentId, user.getFullName(), user.getEmail(),
                user.getAvailabilityStatus().name(), from, to);
    }

    private AgentPerformanceDto buildMetrics(UUID agentId, String name, String email,
                                              String status, Instant from, Instant to) {
        long resolved = ticketRepository.countResolvedByAgentInRange(agentId, from, to);
        long open = ticketRepository.countOpenByAgent(agentId);
        Double avgFirst = ticketRepository.avgFirstResponseMinutesByAgent(agentId, from, to);
        Double avgResolution = ticketRepository.avgResolutionMinutesByAgent(agentId, from, to);
        Double csat = csatRatingRepository.avgCsatByAgent(agentId, from, to);

        return new AgentPerformanceDto(
            agentId.toString(),
            name,
            email,
            status,
            resolved,
            open,
            avgFirst != null ? Math.round(avgFirst * 10.0) / 10.0 : 0.0,
            avgResolution != null ? Math.round(avgResolution * 10.0) / 10.0 : 0.0,
            csat != null ? Math.round(csat * 10.0) / 10.0 : 0.0
        );
    }

    public Instant defaultFrom() {
        return Instant.now().minus(30, ChronoUnit.DAYS);
    }
}
