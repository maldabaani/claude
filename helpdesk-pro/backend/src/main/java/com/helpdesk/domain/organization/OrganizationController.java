package com.helpdesk.domain.organization;

import com.helpdesk.domain.user.dto.UserResponse;
import com.helpdesk.shared.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/organizations")
@RequiredArgsConstructor
public class OrganizationController {

    private final OrganizationService organizationService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'TEAM_LEAD')")
    public ResponseEntity<ApiResponse<List<OrganizationDto>>> findAll(
            @RequestParam(required = false) String search) {
        return ResponseEntity.ok(ApiResponse.ok(organizationService.findAll(search)));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<OrganizationDto>> create(@RequestBody OrganizationRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Organization created", organizationService.create(request)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<OrganizationDto>> update(
            @PathVariable UUID id, @RequestBody OrganizationRequest request) {
        return ResponseEntity.ok(ApiResponse.ok("Organization updated", organizationService.update(id, request)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        organizationService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok("Organization deleted", null));
    }

    @GetMapping("/{id}/members")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEAM_LEAD')")
    public ResponseEntity<ApiResponse<List<UserResponse>>> getMembers(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(organizationService.getMembers(id)));
    }

    @PostMapping("/{id}/members")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> addMember(
            @PathVariable UUID id, @RequestBody Map<String, UUID> body) {
        organizationService.addMember(id, body.get("userId"));
        return ResponseEntity.ok(ApiResponse.ok("Member added", null));
    }

    @DeleteMapping("/{id}/members/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> removeMember(
            @PathVariable UUID id, @PathVariable UUID userId) {
        organizationService.removeMember(id, userId);
        return ResponseEntity.ok(ApiResponse.ok("Member removed", null));
    }
}
