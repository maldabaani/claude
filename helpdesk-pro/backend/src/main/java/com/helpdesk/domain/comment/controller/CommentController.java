package com.helpdesk.domain.comment.controller;

import com.helpdesk.domain.comment.dto.CommentResponse;
import com.helpdesk.domain.comment.dto.CreateCommentRequest;
import com.helpdesk.domain.comment.service.CommentService;
import com.helpdesk.domain.user.entity.User;
import com.helpdesk.shared.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/tickets/{ticketId}/comments")
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<CommentResponse>>> findAll(
            @PathVariable UUID ticketId,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(ApiResponse.ok(commentService.findByTicket(ticketId, currentUser)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<CommentResponse>> create(
            @PathVariable UUID ticketId,
            @Valid @RequestBody CreateCommentRequest request,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(ApiResponse.ok("Comment added", commentService.create(ticketId, request, currentUser)));
    }

    @PatchMapping("/{commentId}")
    public ResponseEntity<ApiResponse<CommentResponse>> update(
            @PathVariable UUID ticketId,
            @PathVariable UUID commentId,
            @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(ApiResponse.ok("Comment updated", commentService.update(ticketId, commentId, body.get("body"))));
    }

    @DeleteMapping("/{commentId}")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable UUID ticketId,
            @PathVariable UUID commentId) {
        commentService.delete(ticketId, commentId);
        return ResponseEntity.ok(ApiResponse.ok("Comment deleted", null));
    }
}
