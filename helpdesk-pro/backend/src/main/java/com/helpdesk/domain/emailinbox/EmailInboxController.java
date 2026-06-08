package com.helpdesk.domain.emailinbox;

import com.helpdesk.shared.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/email-inboxes")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class EmailInboxController {

    private final EmailInboxService emailInboxService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<EmailInboxDto>>> findAll() {
        return ResponseEntity.ok(ApiResponse.ok(emailInboxService.findAll()));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<EmailInboxDto>> create(@Valid @RequestBody CreateEmailInboxRequest request) {
        return ResponseEntity.ok(ApiResponse.ok("Email inbox created", emailInboxService.create(request)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<EmailInboxDto>> update(
            @PathVariable UUID id, @Valid @RequestBody CreateEmailInboxRequest request) {
        return ResponseEntity.ok(ApiResponse.ok("Email inbox updated", emailInboxService.update(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        emailInboxService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok("Email inbox deleted", null));
    }

    @PostMapping("/{id}/test")
    public ResponseEntity<ApiResponse<Map<String, String>>> test(@PathVariable UUID id) {
        String result = emailInboxService.testConnection(id);
        return ResponseEntity.ok(ApiResponse.ok(Map.of("result", result)));
    }
}
