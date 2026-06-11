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

    private final AutomationRuleService automationRuleService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<AutomationRule>>> getAll() {
        return ResponseEntity.ok(ApiResponse.ok(automationRuleService.getAll()));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<AutomationRule>> create(@RequestBody AutomationRule rule) {
        return ResponseEntity.ok(ApiResponse.ok("Automation rule created", automationRuleService.create(rule)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<AutomationRule>> update(@PathVariable Long id, @RequestBody AutomationRule rule) {
        return ResponseEntity.ok(ApiResponse.ok("Automation rule updated", automationRuleService.update(id, rule)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        automationRuleService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok("Automation rule deleted", null));
    }

    @PatchMapping("/{id}/toggle")
    public ResponseEntity<ApiResponse<AutomationRule>> toggle(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok("Automation rule toggled", automationRuleService.toggle(id)));
    }
}
