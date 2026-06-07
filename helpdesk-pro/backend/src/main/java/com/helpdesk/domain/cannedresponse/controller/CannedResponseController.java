package com.helpdesk.domain.cannedresponse.controller;

import com.helpdesk.domain.cannedresponse.dto.CannedResponseRequest;
import com.helpdesk.domain.cannedresponse.dto.CannedResponseResponse;
import com.helpdesk.domain.cannedresponse.service.CannedResponseService;
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
@RequestMapping("/api/v1/canned-responses")
@RequiredArgsConstructor
public class CannedResponseController {

    private final CannedResponseService cannedResponseService;

    @GetMapping
    @PreAuthorize("hasAnyRole('AGENT','TEAM_LEAD','ADMIN')")
    public ResponseEntity<ApiResponse<List<CannedResponseResponse>>> findAll() {
        return ResponseEntity.ok(ApiResponse.ok(cannedResponseService.findAll()));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('TEAM_LEAD','ADMIN')")
    public ResponseEntity<ApiResponse<CannedResponseResponse>> create(
            @Valid @RequestBody CannedResponseRequest request,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(ApiResponse.ok("Canned response created", cannedResponseService.create(request, currentUser)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('TEAM_LEAD','ADMIN')")
    public ResponseEntity<ApiResponse<CannedResponseResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody CannedResponseRequest request) {
        return ResponseEntity.ok(ApiResponse.ok("Canned response updated", cannedResponseService.update(id, request)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('TEAM_LEAD','ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        cannedResponseService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok("Canned response deleted", null));
    }
}
