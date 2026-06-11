package com.helpdesk.domain.nps.controller;

import com.helpdesk.domain.nps.dto.NpsRequest;
import com.helpdesk.domain.nps.dto.NpsResponseDto;
import com.helpdesk.domain.nps.dto.NpsScoreDto;
import com.helpdesk.domain.nps.service.NpsService;
import com.helpdesk.domain.user.entity.User;
import com.helpdesk.shared.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/nps")
@RequiredArgsConstructor
public class NpsController {

    private final NpsService npsService;

    @PostMapping("/tickets/{ticketId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<NpsResponseDto>> submit(
            @PathVariable UUID ticketId,
            @Valid @RequestBody NpsRequest request,
            @AuthenticationPrincipal User currentUser) {
        NpsResponseDto dto = npsService.submit(ticketId, currentUser.getId(), request);
        return ResponseEntity.ok(ApiResponse.ok(dto));
    }

    @GetMapping("/tickets/{ticketId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<NpsResponseDto>> getByTicket(@PathVariable UUID ticketId) {
        return ResponseEntity.ok(ApiResponse.ok(npsService.getByTicket(ticketId).orElse(null)));
    }

    @GetMapping("/score")
    @PreAuthorize("hasAnyRole('ADMIN','TEAM_LEAD')")
    public ResponseEntity<ApiResponse<NpsScoreDto>> getScore(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to) {
        if (from == null) from = Instant.now().minus(30, ChronoUnit.DAYS);
        if (to == null) to = Instant.now();
        return ResponseEntity.ok(ApiResponse.ok(npsService.getScore(from, to)));
    }

    @GetMapping("/responses")
    @PreAuthorize("hasAnyRole('ADMIN','TEAM_LEAD')")
    public ResponseEntity<ApiResponse<List<NpsResponseDto>>> getResponses(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to) {
        if (from == null) from = Instant.now().minus(30, ChronoUnit.DAYS);
        if (to == null) to = Instant.now();
        return ResponseEntity.ok(ApiResponse.ok(npsService.getResponses(from, to)));
    }
}
