package com.helpdesk.domain.issue;

import com.helpdesk.domain.ticket.dto.TicketResponse;
import com.helpdesk.domain.user.entity.User;
import com.helpdesk.shared.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/issues")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('AGENT', 'ADMIN', 'TEAM_LEAD')")
public class IssueController {

    private final IssueService issueService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<IssueDto>>> findAll() {
        return ResponseEntity.ok(ApiResponse.ok(issueService.findAll()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<IssueDto>> findById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(issueService.findById(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<IssueDto>> create(
            @RequestBody IssueRequest request,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Issue created", issueService.create(request, currentUser.getId())));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<IssueDto>> update(
            @PathVariable UUID id, @RequestBody IssueRequest request) {
        return ResponseEntity.ok(ApiResponse.ok("Issue updated", issueService.update(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        issueService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok("Issue deleted", null));
    }

    @GetMapping("/{id}/tickets")
    public ResponseEntity<ApiResponse<List<TicketResponse>>> getLinkedTickets(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(issueService.getLinkedTickets(id)));
    }

    @PostMapping("/{id}/tickets")
    public ResponseEntity<ApiResponse<Void>> linkTicket(
            @PathVariable UUID id, @RequestBody Map<String, UUID> body) {
        issueService.linkTicket(id, body.get("ticketId"));
        return ResponseEntity.ok(ApiResponse.ok("Ticket linked", null));
    }

    @DeleteMapping("/{id}/tickets/{ticketId}")
    public ResponseEntity<ApiResponse<Void>> unlinkTicket(
            @PathVariable UUID id, @PathVariable UUID ticketId) {
        issueService.unlinkTicket(id, ticketId);
        return ResponseEntity.ok(ApiResponse.ok("Ticket unlinked", null));
    }
}
