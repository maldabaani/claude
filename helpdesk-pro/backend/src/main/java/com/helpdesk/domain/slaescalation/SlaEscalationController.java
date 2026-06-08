package com.helpdesk.domain.slaescalation;

import com.helpdesk.shared.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/sla-rules")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class SlaEscalationController {

    private final SlaEscalationService slaEscalationService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<SlaEscalationRule>>> getRules() {
        return ResponseEntity.ok(ApiResponse.ok(slaEscalationService.getAllRules()));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<SlaEscalationRule>> createRule(@RequestBody SlaEscalationRule rule) {
        return ResponseEntity.ok(ApiResponse.ok("Rule created", slaEscalationService.createRule(rule)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteRule(@PathVariable UUID id) {
        slaEscalationService.deleteRule(id);
        return ResponseEntity.ok(ApiResponse.ok("Rule deleted", null));
    }
}
