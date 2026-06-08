package com.helpdesk.domain.customfield;

import com.helpdesk.shared.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class CustomFieldController {

    private final CustomFieldService customFieldService;

    @GetMapping("/api/v1/custom-fields")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<CustomFieldDto>>> getFields() {
        return ResponseEntity.ok(ApiResponse.ok(customFieldService.getActiveFields()));
    }

    @PostMapping("/api/v1/custom-fields")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<CustomFieldDto>> createField(@RequestBody CustomFieldDto dto) {
        return ResponseEntity.ok(ApiResponse.ok("Custom field created", customFieldService.createField(dto)));
    }

    @DeleteMapping("/api/v1/custom-fields/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteField(@PathVariable UUID id) {
        customFieldService.deleteField(id);
        return ResponseEntity.ok(ApiResponse.ok("Custom field deleted", null));
    }

    @GetMapping("/api/v1/tickets/{ticketId}/custom-values")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Map<String, String>>> getValues(@PathVariable UUID ticketId) {
        return ResponseEntity.ok(ApiResponse.ok(customFieldService.getValuesForTicket(ticketId)));
    }

    @PostMapping("/api/v1/tickets/{ticketId}/custom-values")
    @PreAuthorize("hasAnyRole('AGENT','TEAM_LEAD','ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, String>>> saveValues(
            @PathVariable UUID ticketId,
            @RequestBody Map<String, String> values) {
        return ResponseEntity.ok(ApiResponse.ok("Values saved", customFieldService.saveValues(ticketId, values)));
    }
}
