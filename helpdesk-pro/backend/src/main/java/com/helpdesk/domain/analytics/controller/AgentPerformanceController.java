package com.helpdesk.domain.analytics.controller;

import com.helpdesk.domain.analytics.dto.AgentPerformanceDto;
import com.helpdesk.domain.analytics.service.AgentPerformanceService;
import com.helpdesk.shared.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/analytics/agents")
@RequiredArgsConstructor
public class AgentPerformanceController {

    private final AgentPerformanceService agentPerformanceService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','TEAM_LEAD')")
    public ResponseEntity<ApiResponse<List<AgentPerformanceDto>>> getAllAgents(
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to) {
        Instant fromInstant = from != null ? Instant.parse(from) : agentPerformanceService.defaultFrom();
        Instant toInstant = to != null ? Instant.parse(to) : Instant.now();
        return ResponseEntity.ok(ApiResponse.ok(agentPerformanceService.getAllAgentMetrics(fromInstant, toInstant)));
    }

    @GetMapping("/{agentId}")
    @PreAuthorize("hasAnyRole('ADMIN','TEAM_LEAD')")
    public ResponseEntity<ApiResponse<AgentPerformanceDto>> getAgent(
            @PathVariable UUID agentId,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to) {
        Instant fromInstant = from != null ? Instant.parse(from) : agentPerformanceService.defaultFrom();
        Instant toInstant = to != null ? Instant.parse(to) : Instant.now();
        return ResponseEntity.ok(ApiResponse.ok(agentPerformanceService.getAgentMetrics(agentId, fromInstant, toInstant)));
    }
}
