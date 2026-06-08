package com.helpdesk.domain.user.controller;

import com.helpdesk.domain.user.dto.UpdateProfileRequest;
import com.helpdesk.domain.user.dto.UpdateUserRequest;
import com.helpdesk.domain.user.dto.UserResponse;
import com.helpdesk.domain.user.entity.Role;
import com.helpdesk.domain.user.entity.User;
import com.helpdesk.domain.user.service.UserService;
import com.helpdesk.shared.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserResponse>> getMe(@AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(ApiResponse.ok(userService.findById(currentUser.getId())));
    }

    @GetMapping("/me/2fa-status")
    public ResponseEntity<ApiResponse<java.util.Map<String, Boolean>>> getTwoFaStatus(
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(ApiResponse.ok(java.util.Map.of("totpEnabled", currentUser.isTotpEnabled())));
    }

    @PutMapping("/me")
    public ResponseEntity<ApiResponse<UserResponse>> updateMe(
            @Valid @RequestBody UpdateProfileRequest request,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(ApiResponse.ok("Profile updated", userService.updateProfile(currentUser.getId(), request)));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'TEAM_LEAD')")
    public ResponseEntity<ApiResponse<Page<UserResponse>>> findAll(
            @RequestParam(required = false) Role role,
            Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.ok(userService.findAll(role, pageable)));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or #id == authentication.principal.id")
    public ResponseEntity<ApiResponse<UserResponse>> findById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(userService.findById(id)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or #id == authentication.principal.id")
    public ResponseEntity<ApiResponse<UserResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateUserRequest request) {
        return ResponseEntity.ok(ApiResponse.ok("User updated", userService.update(id, request)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        userService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok("User deleted", null));
    }
}
