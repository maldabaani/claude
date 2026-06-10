package com.helpdesk.domain.notification.controller;

import com.helpdesk.domain.notification.entity.Notification;
import com.helpdesk.domain.notification.service.NotificationService;
import com.helpdesk.domain.user.entity.User;
import com.helpdesk.shared.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<Notification>>> getAll(
            @AuthenticationPrincipal User currentUser, Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.ok(
                notificationService.getNotifications(currentUser.getId(), pageable)));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getUnreadCount(
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(ApiResponse.ok(
                Map.of("count", notificationService.getUnreadCount(currentUser.getId()))));
    }

    @PostMapping("/mark-all-read")
    public ResponseEntity<ApiResponse<Void>> markAllRead(@AuthenticationPrincipal User currentUser) {
        notificationService.markAllRead(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.ok("All notifications marked as read", null));
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<ApiResponse<Void>> markRead(
            @AuthenticationPrincipal User currentUser, @PathVariable java.util.UUID id) {
        notificationService.markRead(currentUser.getId(), id);
        return ResponseEntity.ok(ApiResponse.ok("Notification marked as read", null));
    }
}
