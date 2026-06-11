package com.helpdesk.domain.automation;

import com.helpdesk.shared.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/automation-rules")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AutomationRuleController {

    private final AutomationRuleService service;

    @GetMapping
    public ResponseEntity<ApiResponse<List<AutomationRule>>> getAll() {
        return ResponseEntity.ok(ApiResponse.ok(service.getAll()));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<AutomationRule>> create(@RequestBody AutomationRule rule) {
        return ResponseEntity.ok(ApiResponse.ok("Automation rule created", service.create(rule)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<AutomationRule>> update(@PathVariable Long id, @RequestBody AutomationRule rule) {
        return ResponseEntity.ok(ApiResponse.ok("Automation rule updated", service.update(id, rule)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok("Automation rule deleted", null));
    }
}
