package com.helpdesk.domain.customerprofile.controller;

import com.helpdesk.domain.customerprofile.dto.*;
import com.helpdesk.domain.customerprofile.service.CustomerProfileService;
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
@RequestMapping("/api/v1/users/{id}")
@RequiredArgsConstructor
public class CustomerProfileController {

    private final CustomerProfileService customerProfileService;

    @GetMapping("/profile")
    @PreAuthorize("hasAnyRole('AGENT', 'TEAM_LEAD', 'ADMIN')")
    public ResponseEntity<ApiResponse<CustomerProfileResponse>> getProfile(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(customerProfileService.getProfile(id)));
    }

    @GetMapping("/notes")
    @PreAuthorize("hasAnyRole('AGENT', 'TEAM_LEAD', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<CustomerNoteResponse>>> getNotes(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(customerProfileService.getNotes(id)));
    }

    @PostMapping("/notes")
    @PreAuthorize("hasAnyRole('AGENT', 'TEAM_LEAD', 'ADMIN')")
    public ResponseEntity<ApiResponse<CustomerNoteResponse>> addNote(
            @PathVariable UUID id,
            @Valid @RequestBody CreateCustomerNoteRequest request,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(ApiResponse.ok("Note added",
                customerProfileService.addNote(id, currentUser.getId(), request.content())));
    }

    @DeleteMapping("/notes/{noteId}")
    @PreAuthorize("hasAnyRole('AGENT', 'TEAM_LEAD', 'ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteNote(
            @PathVariable UUID id,
            @PathVariable UUID noteId,
            @AuthenticationPrincipal User currentUser) {
        customerProfileService.deleteNote(id, noteId, currentUser.getId());
        return ResponseEntity.ok(ApiResponse.ok("Note deleted", null));
    }
}
