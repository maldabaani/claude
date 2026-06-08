package com.helpdesk.domain.helptopic;

import com.helpdesk.shared.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/help-topics")
@RequiredArgsConstructor
public class HelpTopicController {

    private final HelpTopicService helpTopicService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<HelpTopicDto>>> findAll() {
        return ResponseEntity.ok(ApiResponse.ok(helpTopicService.findAllActive()));
    }

    @GetMapping("/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<HelpTopicDto>>> findAllAdmin() {
        return ResponseEntity.ok(ApiResponse.ok(helpTopicService.findAll()));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<HelpTopicDto>> create(@RequestBody HelpTopicDto request) {
        return ResponseEntity.ok(ApiResponse.ok("Help topic created", helpTopicService.create(request)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<HelpTopicDto>> update(@PathVariable UUID id, @RequestBody HelpTopicDto request) {
        return ResponseEntity.ok(ApiResponse.ok("Help topic updated", helpTopicService.update(id, request)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        helpTopicService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok("Help topic deleted", null));
    }
}
