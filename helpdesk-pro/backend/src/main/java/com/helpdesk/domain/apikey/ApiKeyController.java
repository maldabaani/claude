package com.helpdesk.domain.apikey;

import com.helpdesk.shared.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import com.helpdesk.domain.user.repository.UserRepository;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/api-keys")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class ApiKeyController {

    private final ApiKeyService apiKeyService;
    private final UserRepository userRepository;

    public record CreateKeyRequest(String name, String expiresAt) {}

    @GetMapping
    public ResponseEntity<ApiResponse<List<ApiKey>>> list(@AuthenticationPrincipal UserDetails userDetails) {
        UUID userId = userRepository.findByEmailAndDeletedAtIsNull(userDetails.getUsername())
            .map(u -> u.getId()).orElseThrow();
        return ResponseEntity.ok(ApiResponse.ok(apiKeyService.findByUser(userId)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> create(
            @RequestBody CreateKeyRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        UUID userId = userRepository.findByEmailAndDeletedAtIsNull(userDetails.getUsername())
            .map(u -> u.getId()).orElseThrow();
        Instant expiresAt = request.expiresAt() != null ? Instant.parse(request.expiresAt()) : null;
        ApiKeyService.GeneratedKey result = apiKeyService.generate(request.name(), userId, expiresAt);
        Map<String, Object> response = Map.of(
            "id", result.apiKey().getId(),
            "name", result.apiKey().getName(),
            "key", result.plainKey(),
            "prefix", result.apiKey().getKeyPrefix(),
            "createdAt", result.apiKey().getCreatedAt()
        );
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> revoke(@PathVariable UUID id) {
        apiKeyService.revoke(id);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }
}
