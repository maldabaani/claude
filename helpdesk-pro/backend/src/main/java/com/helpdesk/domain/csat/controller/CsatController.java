package com.helpdesk.domain.csat.controller;

import com.helpdesk.domain.csat.dto.CsatRequest;
import com.helpdesk.domain.csat.dto.CsatResponse;
import com.helpdesk.domain.csat.dto.CsatStatsResponse;
import com.helpdesk.domain.csat.service.CsatService;
import com.helpdesk.domain.user.entity.User;
import com.helpdesk.shared.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/csat")
@RequiredArgsConstructor
public class CsatController {

    private final CsatService csatService;

    @PostMapping("/tickets/{ticketId}/rating")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<CsatResponse>> submitRating(
            @PathVariable UUID ticketId,
            @RequestBody CsatRequest request,
            @AuthenticationPrincipal User currentUser) {
        CsatResponse response = csatService.submitRating(ticketId, request, currentUser);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/tickets/{ticketId}/rating")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<CsatResponse>> getRating(@PathVariable UUID ticketId) {
        CsatResponse response = csatService.getRating(ticketId).orElse(null);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/stats")
    @PreAuthorize("hasAnyRole('ADMIN','TEAM_LEAD')")
    public ResponseEntity<ApiResponse<CsatStatsResponse>> getStats() {
        return ResponseEntity.ok(ApiResponse.ok(csatService.getOverallStats()));
    }
}
