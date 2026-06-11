package com.helpdesk.domain.ticket.controller;

import com.helpdesk.domain.ticket.dto.TicketDraftRequest;
import com.helpdesk.domain.ticket.dto.TicketDraftResponse;
import com.helpdesk.domain.ticket.service.TicketDraftService;
import com.helpdesk.domain.user.entity.User;
import com.helpdesk.shared.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/tickets/{id}/draft")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('AGENT', 'TEAM_LEAD', 'ADMIN')")
public class TicketDraftController {

    private final TicketDraftService draftService;

    @GetMapping
    public ResponseEntity<ApiResponse<TicketDraftResponse>> getDraft(
            @PathVariable UUID id,
            @AuthenticationPrincipal User currentUser) {
        return draftService.getDraft(id, currentUser.getId())
                .map(draft -> ResponseEntity.ok(ApiResponse.ok(draft)))
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping
    public ResponseEntity<ApiResponse<TicketDraftResponse>> saveDraft(
            @PathVariable UUID id,
            @Valid @RequestBody TicketDraftRequest request,
            @AuthenticationPrincipal User currentUser) {
        TicketDraftResponse saved = draftService.saveDraft(id, currentUser.getId(), request);
        return ResponseEntity.ok(ApiResponse.ok("Draft saved", saved));
    }

    @DeleteMapping
    public ResponseEntity<ApiResponse<Void>> deleteDraft(
            @PathVariable UUID id,
            @AuthenticationPrincipal User currentUser) {
        draftService.deleteDraft(id, currentUser.getId());
        return ResponseEntity.ok(ApiResponse.ok("Draft deleted", null));
    }
}
