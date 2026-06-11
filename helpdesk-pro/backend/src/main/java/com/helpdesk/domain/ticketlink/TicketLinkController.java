package com.helpdesk.domain.ticketlink;

import com.helpdesk.domain.user.entity.User;
import com.helpdesk.shared.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/tickets/{ticketId}/links")
@RequiredArgsConstructor
public class TicketLinkController {

    private final TicketLinkService ticketLinkService;

    @GetMapping
    @PreAuthorize("hasAnyRole('AGENT', 'TEAM_LEAD', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<TicketLinkResponse>>> getLinks(@PathVariable UUID ticketId) {
        return ResponseEntity.ok(ApiResponse.ok(ticketLinkService.getLinks(ticketId)));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('AGENT', 'TEAM_LEAD', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<TicketLinkResponse>>> addLink(
            @PathVariable UUID ticketId,
            @Valid @RequestBody TicketLinkRequest request,
            @AuthenticationPrincipal User currentUser) {
        List<TicketLinkResponse> links = ticketLinkService.addLink(
                ticketId, request.targetTicketId(), request.linkType(), currentUser.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("Link created", links));
    }

    @DeleteMapping("/{linkId}")
    @PreAuthorize("hasAnyRole('AGENT', 'TEAM_LEAD', 'ADMIN')")
    public ResponseEntity<ApiResponse<Void>> removeLink(
            @PathVariable UUID ticketId,
            @PathVariable UUID linkId,
            @AuthenticationPrincipal User currentUser) {
        ticketLinkService.removeLink(linkId, currentUser.getId());
        return ResponseEntity.ok(ApiResponse.ok("Link removed", null));
    }
}
