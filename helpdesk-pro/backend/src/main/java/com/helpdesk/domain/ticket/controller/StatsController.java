package com.helpdesk.domain.ticket.controller;

import com.helpdesk.domain.ticket.entity.TicketStatus;
import com.helpdesk.domain.ticket.repository.TicketRepository;
import com.helpdesk.shared.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/stats")
@RequiredArgsConstructor
public class StatsController {

    private final TicketRepository ticketRepository;

    @GetMapping("/dashboard")
    @PreAuthorize("hasAnyRole('AGENT', 'TEAM_LEAD', 'ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getDashboard() {
        return ResponseEntity.ok(ApiResponse.ok(Map.of(
                "openTickets", ticketRepository.countByStatus(TicketStatus.OPEN),
                "pendingTickets", ticketRepository.countByStatus(TicketStatus.PENDING),
                "resolvedToday", ticketRepository.countResolvedSince(Instant.now().minus(1, ChronoUnit.DAYS)),
                "slaBreached", ticketRepository.countActiveSlaBreached(),
                "newTickets", ticketRepository.countByStatus(TicketStatus.NEW),
                "onHold", ticketRepository.countByStatus(TicketStatus.ON_HOLD)
        )));
    }

    @GetMapping("/agent/{agentId}")
    @PreAuthorize("hasAnyRole('AGENT', 'TEAM_LEAD', 'ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAgentStats(@PathVariable UUID agentId) {
        return ResponseEntity.ok(ApiResponse.ok(Map.of(
                "openTickets", ticketRepository.countOpenByAgent(agentId)
        )));
    }
}
