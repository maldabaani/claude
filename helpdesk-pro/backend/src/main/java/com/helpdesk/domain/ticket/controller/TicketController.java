package com.helpdesk.domain.ticket.controller;

import com.helpdesk.domain.ticket.dto.BulkTicketRequest;
import com.helpdesk.domain.ticket.dto.CreateTicketRequest;
import com.helpdesk.domain.ticket.dto.TicketResponse;
import com.helpdesk.domain.ticket.dto.UpdateTicketRequest;
import com.helpdesk.domain.ticket.entity.Priority;
import com.helpdesk.domain.ticket.entity.TicketStatus;
import com.helpdesk.domain.ticket.service.TicketService;
import com.helpdesk.domain.user.entity.User;
import com.helpdesk.shared.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/tickets")
@RequiredArgsConstructor
public class TicketController {

    private final TicketService ticketService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<TicketResponse>>> findAll(
            @RequestParam(required = false) TicketStatus status,
            @RequestParam(required = false) Priority priority,
            @RequestParam(required = false) UUID departmentId,
            @RequestParam(required = false) UUID agentId,
            @RequestParam(required = false) UUID createdById,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to,
            Pageable pageable,
            @AuthenticationPrincipal User currentUser) {

        UUID filterByCreated = currentUser.getRole().name().equals("CUSTOMER") ? currentUser.getId() : createdById;
        Page<TicketResponse> page = ticketService.findAll(status, priority, departmentId, agentId, filterByCreated, from, to, pageable);
        return ResponseEntity.ok(ApiResponse.ok(page));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<TicketResponse>> create(
            @Valid @RequestBody CreateTicketRequest request,
            @AuthenticationPrincipal User currentUser) {
        TicketResponse ticket = ticketService.create(request, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("Ticket created", ticket));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<TicketResponse>> findById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(ticketService.findById(id)));
    }

    @PatchMapping("/{id}")
    @PreAuthorize("hasAnyRole('AGENT', 'TEAM_LEAD', 'ADMIN')")
    public ResponseEntity<ApiResponse<TicketResponse>> update(
            @PathVariable UUID id,
            @RequestBody UpdateTicketRequest request) {
        return ResponseEntity.ok(ApiResponse.ok("Ticket updated", ticketService.update(id, request)));
    }

    @PatchMapping("/{id}/assign")
    @PreAuthorize("hasAnyRole('AGENT', 'TEAM_LEAD', 'ADMIN')")
    public ResponseEntity<ApiResponse<TicketResponse>> assign(
            @PathVariable UUID id,
            @RequestBody Map<String, UUID> body) {
        return ResponseEntity.ok(ApiResponse.ok("Ticket assigned", ticketService.assign(id, body.get("agentId"))));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<TicketResponse>> changeStatus(
            @PathVariable UUID id,
            @RequestBody Map<String, String> body) {
        TicketStatus newStatus = TicketStatus.valueOf(body.get("status"));
        return ResponseEntity.ok(ApiResponse.ok("Status updated", ticketService.changeStatus(id, newStatus)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        ticketService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok("Ticket deleted", null));
    }

    @PostMapping("/bulk")
    @PreAuthorize("hasAnyRole('AGENT','TEAM_LEAD','ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> bulkAction(
            @Valid @RequestBody BulkTicketRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(ticketService.bulkAction(request)));
    }
}
