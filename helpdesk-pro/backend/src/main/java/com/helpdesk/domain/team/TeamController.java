package com.helpdesk.domain.team;

import com.helpdesk.domain.user.entity.User;
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
@RequestMapping("/api/v1/teams")
@RequiredArgsConstructor
public class TeamController {

    private final TeamService teamService;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<Team>>> findAll() {
        return ResponseEntity.ok(ApiResponse.ok(teamService.findAll()));
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Team>> findById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(teamService.findById(id)));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Team>> create(@RequestBody Team request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Team created", teamService.create(request)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Team>> update(@PathVariable UUID id, @RequestBody Team request) {
        return ResponseEntity.ok(ApiResponse.ok("Team updated", teamService.update(id, request)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        teamService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok("Team deleted", null));
    }

    @GetMapping("/{id}/members")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<User>>> getMembers(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(teamService.getMembers(id)));
    }

    @PostMapping("/{id}/members")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEAM_LEAD')")
    public ResponseEntity<ApiResponse<Team>> addMember(@PathVariable UUID id, @RequestBody Map<String, String> body) {
        UUID userId = UUID.fromString(body.get("userId"));
        return ResponseEntity.ok(ApiResponse.ok("Member added", teamService.addMember(id, userId)));
    }

    @DeleteMapping("/{id}/members/{userId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEAM_LEAD')")
    public ResponseEntity<ApiResponse<Team>> removeMember(@PathVariable UUID id, @PathVariable UUID userId) {
        return ResponseEntity.ok(ApiResponse.ok("Member removed", teamService.removeMember(id, userId)));
    }
}
