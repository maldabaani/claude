package com.helpdesk.domain.savedview.controller;

import com.helpdesk.domain.savedview.dto.SavedViewRequest;
import com.helpdesk.domain.savedview.dto.SavedViewResponse;
import com.helpdesk.domain.savedview.service.SavedViewService;
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
@RequestMapping("/api/v1/saved-views")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('AGENT', 'TEAM_LEAD', 'ADMIN')")
public class SavedViewController {

    private final SavedViewService savedViewService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<SavedViewResponse>>> getAll(
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(ApiResponse.ok(savedViewService.findAll(currentUser.getId())));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<SavedViewResponse>> create(
            @Valid @RequestBody SavedViewRequest request,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Saved view created", savedViewService.create(request, currentUser.getId())));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable UUID id,
            @AuthenticationPrincipal User currentUser) {
        savedViewService.delete(id, currentUser.getId());
        return ResponseEntity.ok(ApiResponse.ok("Saved view deleted", null));
    }
}
