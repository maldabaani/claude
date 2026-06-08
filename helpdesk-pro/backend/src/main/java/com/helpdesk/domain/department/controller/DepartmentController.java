package com.helpdesk.domain.department.controller;

import com.helpdesk.domain.department.entity.Department;
import com.helpdesk.domain.department.service.DepartmentService;
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
@RequestMapping("/api/v1/departments")
@RequiredArgsConstructor
public class DepartmentController {

    private final DepartmentService departmentService;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Page<Department>>> findAll(Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.ok(departmentService.findAll(pageable)));
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Department>> findById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(departmentService.findById(id)));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Department>> create(@RequestBody Department request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Department created", departmentService.create(request)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Department>> update(
            @PathVariable UUID id, @RequestBody Department request) {
        return ResponseEntity.ok(ApiResponse.ok("Department updated", departmentService.update(id, request)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        departmentService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok("Department deleted", null));
    }
}
