package com.helpdesk.domain.sla.controller;

import com.helpdesk.domain.sla.entity.SlaPolicy;
import com.helpdesk.domain.sla.service.SlaPolicyService;
import com.helpdesk.shared.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/sla")
@RequiredArgsConstructor
public class SlaPolicyController {

    private final SlaPolicyService slaPolicyService;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Page<SlaPolicy>>> findAll(Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.ok(slaPolicyService.findAll(pageable)));
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<SlaPolicy>> findById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(slaPolicyService.findById(id)));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<SlaPolicy>> create(@RequestBody SlaPolicy request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("SLA policy created", slaPolicyService.create(request)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<SlaPolicy>> update(
            @PathVariable UUID id, @RequestBody SlaPolicy request) {
        return ResponseEntity.ok(ApiResponse.ok("SLA policy updated", slaPolicyService.update(id, request)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        slaPolicyService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok("SLA policy deleted", null));
    }
}
