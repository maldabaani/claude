package com.helpdesk.domain.notification.controller;

import com.helpdesk.domain.notification.entity.NotificationPreference;
import com.helpdesk.domain.notification.service.NotificationPreferenceService;
import com.helpdesk.domain.user.entity.User;
import com.helpdesk.shared.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/notification-preferences")
@RequiredArgsConstructor
public class NotificationPreferenceController {

    private final NotificationPreferenceService service;

    @GetMapping
    public ResponseEntity<ApiResponse<List<NotificationPreference>>> getAll(
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPreferences(currentUser.getId())));
    }

    @PutMapping("/{eventType}")
    public ResponseEntity<ApiResponse<NotificationPreference>> update(
            @PathVariable String eventType,
            @RequestBody Map<String, Boolean> body,
            @AuthenticationPrincipal User currentUser) {
        boolean email = body.getOrDefault("emailEnabled", true);
        boolean inApp = body.getOrDefault("inAppEnabled", true);
        return ResponseEntity.ok(ApiResponse.ok(service.upsert(currentUser.getId(), eventType, email, inApp)));
    }
}
