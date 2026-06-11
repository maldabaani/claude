package com.helpdesk.domain.roundrobin;

import com.helpdesk.shared.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/round-robin")
@RequiredArgsConstructor
public class RoundRobinController {

    private final RoundRobinService roundRobinService;

    @GetMapping("/config")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<RoundRobinConfig>> getGlobalConfig() {
        return ResponseEntity.ok(ApiResponse.ok(roundRobinService.getConfig(null)));
    }

    @PutMapping("/config")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<RoundRobinConfig>> updateGlobalConfig(@RequestBody Map<String, Object> body) {
        boolean enabled = Boolean.TRUE.equals(body.get("isEnabled"));
        return ResponseEntity.ok(ApiResponse.ok(roundRobinService.updateConfig(null, enabled)));
    }

    @GetMapping("/config/department/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<RoundRobinConfig>> getDepartmentConfig(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(roundRobinService.getConfig(id)));
    }

    @PutMapping("/config/department/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<RoundRobinConfig>> updateDepartmentConfig(
            @PathVariable UUID id,
            @RequestBody Map<String, Object> body) {
        boolean enabled = Boolean.TRUE.equals(body.get("isEnabled"));
        return ResponseEntity.ok(ApiResponse.ok(roundRobinService.updateConfig(id, enabled)));
    }
}
