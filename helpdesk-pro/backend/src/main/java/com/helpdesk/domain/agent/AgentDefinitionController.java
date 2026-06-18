package com.helpdesk.domain.agent;

import com.helpdesk.shared.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/agent-definitions")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AgentDefinitionController {

    private final AgentDefinitionService service;

    @GetMapping
    public ResponseEntity<ApiResponse<List<AgentDefinitionResponse>>> getAll() {
        return ResponseEntity.ok(ApiResponse.ok(service.getAll()));
    }

    @GetMapping("/capabilities")
    public ResponseEntity<ApiResponse<List<AgentCapability>>> getCapabilities() {
        return ResponseEntity.ok(ApiResponse.ok(service.getCapabilities()));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<AgentDefinitionResponse>> create(@RequestBody AgentDefinitionRequest request) {
        return ResponseEntity.ok(ApiResponse.ok("Agent created", service.create(request)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<AgentDefinitionResponse>> update(@PathVariable Long id, @RequestBody AgentDefinitionRequest request) {
        return ResponseEntity.ok(ApiResponse.ok("Agent updated", service.update(id, request)));
    }

    @PatchMapping("/{id}/toggle")
    public ResponseEntity<ApiResponse<AgentDefinitionResponse>> toggle(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok("Agent toggled", service.toggle(id)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok("Agent deleted", null));
    }
}
