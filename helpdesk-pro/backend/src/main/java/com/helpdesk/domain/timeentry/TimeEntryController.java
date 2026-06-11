package com.helpdesk.domain.timeentry;

import com.helpdesk.domain.user.entity.User;
import com.helpdesk.shared.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/tickets/{ticketId}/time-entries")
@RequiredArgsConstructor
public class TimeEntryController {

    private final TimeEntryService timeEntryService;

    @GetMapping
    @PreAuthorize("hasAnyRole('AGENT', 'TEAM_LEAD', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<TimeEntryResponse>>> getEntries(@PathVariable UUID ticketId) {
        return ResponseEntity.ok(ApiResponse.ok(timeEntryService.getEntriesForTicket(ticketId)));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('AGENT', 'TEAM_LEAD', 'ADMIN')")
    public ResponseEntity<ApiResponse<TimeEntryResponse>> logTime(
            @PathVariable UUID ticketId,
            @Valid @RequestBody TimeEntryRequest request,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(ApiResponse.ok("Time logged", timeEntryService.logTime(ticketId, request, currentUser.getId())));
    }

    @DeleteMapping("/{entryId}")
    @PreAuthorize("hasAnyRole('AGENT', 'TEAM_LEAD', 'ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteEntry(
            @PathVariable UUID ticketId,
            @PathVariable UUID entryId,
            @AuthenticationPrincipal User currentUser) {
        boolean isAdmin = currentUser.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ROLE_TEAM_LEAD"));
        timeEntryService.deleteEntry(ticketId, entryId, currentUser.getId(), isAdmin);
        return ResponseEntity.ok(ApiResponse.ok("Time entry deleted", null));
    }
}
