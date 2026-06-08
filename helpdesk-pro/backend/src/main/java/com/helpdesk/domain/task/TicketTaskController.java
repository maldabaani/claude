package com.helpdesk.domain.task;

import com.helpdesk.domain.user.entity.User;
import com.helpdesk.shared.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/tickets/{ticketId}/tasks")
@RequiredArgsConstructor
public class TicketTaskController {

    private final TicketTaskService taskService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<TicketTaskDto>>> getTasks(@PathVariable UUID ticketId) {
        return ResponseEntity.ok(ApiResponse.ok(taskService.getTasks(ticketId)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<TicketTaskDto>> create(
            @PathVariable UUID ticketId,
            @RequestBody CreateTaskRequest request,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(ApiResponse.ok("Task created", taskService.create(ticketId, request, currentUser.getId())));
    }

    @PatchMapping("/{taskId}")
    public ResponseEntity<ApiResponse<TicketTaskDto>> toggleCompleted(
            @PathVariable UUID ticketId,
            @PathVariable UUID taskId) {
        return ResponseEntity.ok(ApiResponse.ok("Task updated", taskService.toggleCompleted(ticketId, taskId)));
    }

    @DeleteMapping("/{taskId}")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable UUID ticketId,
            @PathVariable UUID taskId) {
        taskService.delete(ticketId, taskId);
        return ResponseEntity.ok(ApiResponse.ok("Task deleted", null));
    }
}
