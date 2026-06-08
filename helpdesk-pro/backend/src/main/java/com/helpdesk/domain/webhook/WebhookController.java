package com.helpdesk.domain.webhook;

import com.helpdesk.shared.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/webhooks")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class WebhookController {

    private final WebhookService webhookService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Webhook>>> getAll() {
        return ResponseEntity.ok(ApiResponse.ok(webhookService.findAll()));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Webhook>> create(@Valid @RequestBody WebhookRequest request) {
        Webhook webhook = Webhook.builder()
            .name(request.name())
            .url(request.url())
            .secret(request.secret())
            .events(request.events() != null ? request.events() : "ticket.created,ticket.updated,comment.added")
            .active(request.active() != null ? request.active() : true)
            .build();
        return ResponseEntity.ok(ApiResponse.ok(webhookService.create(webhook)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Webhook>> update(@PathVariable UUID id, @Valid @RequestBody WebhookRequest request) {
        Webhook webhook = Webhook.builder()
            .name(request.name())
            .url(request.url())
            .secret(request.secret())
            .events(request.events() != null ? request.events() : "ticket.created,ticket.updated,comment.added")
            .active(request.active() != null ? request.active() : true)
            .build();
        return ResponseEntity.ok(ApiResponse.ok(webhookService.update(id, webhook)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        webhookService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    @PostMapping("/{id}/test")
    public ResponseEntity<ApiResponse<Void>> test(@PathVariable UUID id) {
        webhookService.testWebhook(id);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }
}
