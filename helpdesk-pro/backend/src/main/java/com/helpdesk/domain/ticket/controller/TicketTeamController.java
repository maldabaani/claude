package com.helpdesk.domain.ticket.controller;

import com.helpdesk.domain.ticket.dto.TicketResponse;
import com.helpdesk.domain.ticket.service.TicketService;
import com.helpdesk.shared.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/tickets")
@RequiredArgsConstructor
public class TicketTeamController {

    private final TicketService ticketService;

    @PostMapping("/{ticketId}/team")
    @PreAuthorize("hasAnyRole('ADMIN', 'AGENT', 'TEAM_LEAD')")
    public ResponseEntity<ApiResponse<TicketResponse>> assignTeam(
            @PathVariable UUID ticketId,
            @RequestBody Map<String, String> body) {
        UUID teamId = UUID.fromString(body.get("teamId"));
        return ResponseEntity.ok(ApiResponse.ok("Team assigned", ticketService.assignTeam(ticketId, teamId)));
    }

    @DeleteMapping("/{ticketId}/team")
    @PreAuthorize("hasAnyRole('ADMIN', 'AGENT', 'TEAM_LEAD')")
    public ResponseEntity<ApiResponse<TicketResponse>> unassignTeam(@PathVariable UUID ticketId) {
        return ResponseEntity.ok(ApiResponse.ok("Team unassigned", ticketService.assignTeam(ticketId, null)));
    }
}
