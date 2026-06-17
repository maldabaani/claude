package com.helpdesk.domain.user.controller;

import com.helpdesk.domain.user.dto.AgentAvailabilityResponse;
import com.helpdesk.domain.user.dto.UpdateAvailabilityRequest;
import com.helpdesk.domain.user.entity.User;
import com.helpdesk.domain.user.repository.UserRepository;
import com.helpdesk.shared.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api/v1/agents/availability")
@RequiredArgsConstructor
public class AgentAvailabilityController {

    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<AgentAvailabilityResponse>>> getAllAgentAvailability() {
        List<AgentAvailabilityResponse> agents = userRepository.findAllActiveAgents()
                .stream()
                .map(this::toAvailabilityResponse)
                .toList();
        return ResponseEntity.ok(ApiResponse.ok(agents));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<AgentAvailabilityResponse>> getMyAvailability(
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(ApiResponse.ok(toAvailabilityResponse(currentUser)));
    }

    @PutMapping
    public ResponseEntity<ApiResponse<AgentAvailabilityResponse>> updateAvailability(
            @Valid @RequestBody UpdateAvailabilityRequest request,
            @AuthenticationPrincipal User currentUser) {
        currentUser.setAvailabilityStatus(request.status());
        currentUser.setAvailabilityUpdatedAt(Instant.now());
        User saved = userRepository.save(currentUser);
        return ResponseEntity.ok(ApiResponse.ok("Availability updated", toAvailabilityResponse(saved)));
    }

    private AgentAvailabilityResponse toAvailabilityResponse(User user) {
        return new AgentAvailabilityResponse(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getAvatarUrl(),
                user.getAvailabilityStatus(),
                user.getAvailabilityUpdatedAt()
        );
    }
}
