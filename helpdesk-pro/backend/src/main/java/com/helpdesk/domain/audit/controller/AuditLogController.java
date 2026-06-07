package com.helpdesk.domain.audit.controller;

import com.helpdesk.domain.audit.dto.AuditLogResponse;
import com.helpdesk.domain.audit.service.AuditLogService;
import com.helpdesk.shared.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/audit-logs")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AuditLogController {

    private final AuditLogService auditLogService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<AuditLogResponse>>> findAll(
            @RequestParam(required = false) String entityType,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) UUID actorId,
            Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.ok(auditLogService.getAuditLogs(entityType, action, actorId, pageable)));
    }
}
