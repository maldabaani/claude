package com.helpdesk.domain.macro;

import com.helpdesk.domain.user.entity.User;
import com.helpdesk.shared.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/macros")
@RequiredArgsConstructor
public class MacroController {

    private final MacroService macroService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'AGENT', 'TEAM_LEAD')")
    public ResponseEntity<ApiResponse<List<Macro>>> getActive() {
        return ResponseEntity.ok(ApiResponse.ok(macroService.findActive()));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Macro>> create(
            @Valid @RequestBody MacroRequest request,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(ApiResponse.ok(macroService.create(request, currentUser.getId())));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Macro>> update(
            @PathVariable UUID id,
            @Valid @RequestBody MacroRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(macroService.update(id, request)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        macroService.softDelete(id);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    @PostMapping("/{id}/apply/{ticketId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'AGENT', 'TEAM_LEAD')")
    public ResponseEntity<ApiResponse<Void>> apply(
            @PathVariable UUID id,
            @PathVariable UUID ticketId,
            @AuthenticationPrincipal User currentUser) {
        macroService.applyMacro(id, ticketId, currentUser);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }
}
