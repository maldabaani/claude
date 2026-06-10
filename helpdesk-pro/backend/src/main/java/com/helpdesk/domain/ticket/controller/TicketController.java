package com.helpdesk.domain.ticket.controller;

import com.helpdesk.domain.ticket.dto.BulkTicketRequest;
import com.helpdesk.domain.ticket.dto.CreateTicketRequest;
import com.helpdesk.domain.ticket.dto.TicketResponse;
import com.helpdesk.domain.ticket.dto.UpdateTicketRequest;
import com.helpdesk.domain.ticket.entity.Priority;
import com.helpdesk.domain.ticket.entity.TicketStatus;
import com.helpdesk.domain.ticket.entity.TicketWatcher;
import com.helpdesk.domain.ticket.repository.TicketWatcherRepository;
import com.helpdesk.domain.ticket.service.PresenceService;
import com.helpdesk.domain.ticket.service.TicketService;
import com.helpdesk.domain.user.entity.User;
import com.helpdesk.shared.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/tickets")
@RequiredArgsConstructor
public class TicketController {

    private final TicketService ticketService;
    private final PresenceService presenceService;
    private final TicketWatcherRepository ticketWatcherRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<TicketResponse>>> findAll(
            @RequestParam(required = false) TicketStatus status,
            @RequestParam(required = false) Priority priority,
            @RequestParam(required = false) UUID departmentId,
            @RequestParam(required = false) UUID agentId,
            @RequestParam(required = false) UUID createdById,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to,
            @RequestParam(required = false) String search,
            Pageable pageable,
            @AuthenticationPrincipal User currentUser) {

        UUID filterByCreated = createdById;
        if (currentUser.getRole().name().equals("CUSTOMER")) {
            if (currentUser.getOrganizationId() != null) {
                // org member: filter by org, handled in service
                filterByCreated = null;
            } else {
                filterByCreated = currentUser.getId();
            }
        }
        Page<TicketResponse> page = ticketService.findAll(status, priority, departmentId, agentId, filterByCreated,
                from, to, search, currentUser.getOrganizationId(), currentUser.getId(),
                currentUser.getRole().name().equals("CUSTOMER"), pageable);
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
    @PreAuthorize("hasAnyRole('AGENT', 'TEAM_LEAD', 'ADMIN')")
    public ResponseEntity<ApiResponse<TicketResponse>> changeStatus(
            @PathVariable UUID id,
            @RequestBody Map<String, String> body) {
        TicketStatus newStatus = TicketStatus.valueOf(body.get("status"));
        return ResponseEntity.ok(ApiResponse.ok("Status updated", ticketService.changeStatus(id, newStatus)));
    }

    @PostMapping("/{id}/presence")
    @PreAuthorize("hasAnyRole('AGENT', 'TEAM_LEAD', 'ADMIN')")
    public ResponseEntity<ApiResponse<Void>> recordPresence(
            @PathVariable UUID id,
            @AuthenticationPrincipal User currentUser) {
        presenceService.recordPresence(id, currentUser.getId(), currentUser.getFullName());
        return ResponseEntity.ok(ApiResponse.ok("Presence recorded", null));
    }

    @PostMapping("/{id}/presence/join")
    @PreAuthorize("hasAnyRole('AGENT', 'TEAM_LEAD', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<PresenceService.AgentPresence>>> joinPresence(
            @PathVariable UUID id,
            @AuthenticationPrincipal User currentUser) {
        List<PresenceService.AgentPresence> viewers = presenceService.join(id, currentUser.getId(), currentUser.getFullName());
        return ResponseEntity.ok(ApiResponse.ok(viewers));
    }

    @PostMapping("/{id}/presence/leave")
    @PreAuthorize("hasAnyRole('AGENT', 'TEAM_LEAD', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<PresenceService.AgentPresence>>> leavePresence(
            @PathVariable UUID id,
            @AuthenticationPrincipal User currentUser) {
        List<PresenceService.AgentPresence> viewers = presenceService.leave(id, currentUser.getId());
        return ResponseEntity.ok(ApiResponse.ok(viewers));
    }

    @GetMapping("/{id}/presence")
    @PreAuthorize("hasAnyRole('AGENT', 'TEAM_LEAD', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<PresenceService.AgentPresence>>> getPresence(
            @PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(presenceService.getPresence(id)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        ticketService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok("Ticket deleted", null));
    }

    @GetMapping("/export")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEAM_LEAD')")
    public ResponseEntity<byte[]> exportCsv(@RequestParam(defaultValue = "csv") String format) {
        List<TicketResponse> tickets = ticketService.findAll(null, null, null, null, null, null, null,
                PageRequest.of(0, Integer.MAX_VALUE)).getContent();

        StringBuilder sb = new StringBuilder();
        sb.append("id,subject,status,priority,category,customer_email,agent_email,created_at,resolved_at\n");
        for (TicketResponse t : tickets) {
            sb.append(escapeCsv(t.id().toString())).append(",");
            sb.append(escapeCsv(t.title())).append(",");
            sb.append(escapeCsv(t.status() != null ? t.status().name() : "")).append(",");
            sb.append(escapeCsv(t.priority() != null ? t.priority().name() : "")).append(",");
            sb.append(escapeCsv(t.category())).append(",");
            sb.append(escapeCsv(t.createdBy() != null ? t.createdBy().email() : "")).append(",");
            sb.append(escapeCsv(t.assignedAgent() != null ? t.assignedAgent().email() : "")).append(",");
            sb.append(escapeCsv(t.createdAt() != null ? t.createdAt().toString() : "")).append(",");
            sb.append(escapeCsv(t.resolvedAt() != null ? t.resolvedAt().toString() : "")).append("\n");
        }

        byte[] bytes = sb.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType("text/csv"));
        headers.setContentDispositionFormData("attachment", "tickets.csv");
        headers.setContentLength(bytes.length);
        return ResponseEntity.ok().headers(headers).body(bytes);
    }

    private String escapeCsv(String value) {
        if (value == null) return "";
        if (value.contains(",") || value.contains("\"") || value.contains("\n")) {
            return "\"" + value.replace("\"", "\"\"") + "\"";
        }
        return value;
    }

    // ── Watchers ──────────────────────────────────────────────────────────────

    @GetMapping("/{id}/watchers")
    @PreAuthorize("hasAnyRole('AGENT', 'TEAM_LEAD', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<String>>> getWatchers(@PathVariable UUID id) {
        List<String> emails = ticketWatcherRepository.findByTicketId(id)
                .stream().map(TicketWatcher::getEmail).toList();
        return ResponseEntity.ok(ApiResponse.ok(emails));
    }

    @PostMapping("/{id}/watchers")
    @PreAuthorize("hasAnyRole('AGENT', 'TEAM_LEAD', 'ADMIN')")
    public ResponseEntity<ApiResponse<Void>> addWatcher(
            @PathVariable UUID id,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal User currentUser) {
        String email = body.get("email");
        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Email is required"));
        }
        TicketWatcher watcher = TicketWatcher.builder()
                .ticketId(id)
                .email(email.toLowerCase().trim())
                .addedBy(currentUser.getId())
                .build();
        ticketWatcherRepository.save(watcher);
        return ResponseEntity.ok(ApiResponse.ok("Watcher added", null));
    }

    @DeleteMapping("/{id}/watchers/{email}")
    @PreAuthorize("hasAnyRole('AGENT', 'TEAM_LEAD', 'ADMIN')")
    public ResponseEntity<ApiResponse<Void>> removeWatcher(
            @PathVariable UUID id,
            @PathVariable String email) {
        ticketWatcherRepository.deleteByTicketIdAndEmail(id, email);
        return ResponseEntity.ok(ApiResponse.ok("Watcher removed", null));
    }

    // ── Merge ─────────────────────────────────────────────────────────────────

    @PatchMapping("/{id}/due-date")
    @PreAuthorize("hasAnyRole('AGENT', 'TEAM_LEAD', 'ADMIN')")
    public ResponseEntity<ApiResponse<TicketResponse>> updateDueDate(
            @PathVariable UUID id,
            @RequestBody Map<String, String> body) {
        String dueDateStr = body.get("dueDate");
        Instant dueDate = (dueDateStr != null && !dueDateStr.isBlank()) ? Instant.parse(dueDateStr) : null;
        return ResponseEntity.ok(ApiResponse.ok("Due date updated", ticketService.updateManualDueDate(id, dueDate)));
    }

    @PostMapping("/{id}/merge")
    @PreAuthorize("hasAnyRole('AGENT', 'TEAM_LEAD', 'ADMIN')")
    public ResponseEntity<ApiResponse<TicketResponse>> mergeTicket(
            @PathVariable UUID id,
            @RequestBody Map<String, UUID> body,
            @AuthenticationPrincipal User currentUser) {
        UUID targetTicketId = body.get("targetTicketId");
        TicketResponse result = ticketService.mergeTicket(id, targetTicketId, currentUser.getId());
        return ResponseEntity.ok(ApiResponse.ok("Ticket merged", result));
    }

    @PostMapping("/bulk")
    @PreAuthorize("hasAnyRole('AGENT','TEAM_LEAD','ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> bulkAction(
            @Valid @RequestBody BulkTicketRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(ticketService.bulkAction(request)));
    }
}
