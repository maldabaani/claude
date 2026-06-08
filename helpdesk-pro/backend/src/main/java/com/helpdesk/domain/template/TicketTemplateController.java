package com.helpdesk.domain.template;

import com.helpdesk.shared.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/ticket-templates")
@RequiredArgsConstructor
public class TicketTemplateController {

    private final TicketTemplateService templateService;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<TicketTemplate>>> getTemplates() {
        return ResponseEntity.ok(ApiResponse.ok(templateService.getActiveTemplates()));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<TicketTemplate>> createTemplate(@RequestBody TicketTemplate template) {
        return ResponseEntity.ok(ApiResponse.ok("Template created", templateService.createTemplate(template)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<TicketTemplate>> updateTemplate(@PathVariable UUID id, @RequestBody TicketTemplate template) {
        return ResponseEntity.ok(ApiResponse.ok("Template updated", templateService.updateTemplate(id, template)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteTemplate(@PathVariable UUID id) {
        templateService.deleteTemplate(id);
        return ResponseEntity.ok(ApiResponse.ok("Template deleted", null));
    }
}
