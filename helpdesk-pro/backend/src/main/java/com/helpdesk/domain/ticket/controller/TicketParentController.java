package com.helpdesk.domain.ticket.controller;

import com.helpdesk.domain.ticket.dto.CreateChildTicketRequest;
import com.helpdesk.domain.ticket.dto.TicketSummaryDto;
import com.helpdesk.domain.ticket.entity.Priority;
import com.helpdesk.domain.ticket.entity.Ticket;
import com.helpdesk.domain.ticket.repository.TicketRepository;
import com.helpdesk.domain.ticket.service.TicketNumberGenerator;
import com.helpdesk.domain.ticket.service.TicketService;
import com.helpdesk.domain.user.entity.User;
import com.helpdesk.domain.user.repository.UserRepository;
import com.helpdesk.shared.exception.ResourceNotFoundException;
import com.helpdesk.shared.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/tickets")
@RequiredArgsConstructor
public class TicketParentController {

    private final TicketRepository ticketRepository;
    private final TicketService ticketService;
    private final TicketNumberGenerator ticketNumberGenerator;
    private final UserRepository userRepository;

    @GetMapping("/{id}/children")
    @PreAuthorize("hasAnyRole('AGENT', 'TEAM_LEAD', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<TicketSummaryDto>>> getChildren(@PathVariable UUID id) {
        Ticket ticket = ticketRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket", id));
        List<TicketSummaryDto> children = ticket.getChildren().stream()
                .filter(c -> c.getDeletedAt() == null)
                .map(this::toSummary)
                .toList();
        return ResponseEntity.ok(ApiResponse.ok(children));
    }

    @PostMapping("/{id}/children")
    @PreAuthorize("hasAnyRole('AGENT', 'TEAM_LEAD', 'ADMIN')")
    @Transactional
    public ResponseEntity<ApiResponse<TicketSummaryDto>> createChild(
            @PathVariable UUID id,
            @Valid @RequestBody CreateChildTicketRequest request,
            @AuthenticationPrincipal User currentUser) {
        Ticket parent = ticketRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket", id));

        Priority priority = request.priority() != null ? request.priority() : Priority.MEDIUM;

        Ticket child = Ticket.builder()
                .ticketNumber(ticketNumberGenerator.generate())
                .title(request.subject())
                .description(request.description())
                .priority(priority)
                .createdById(currentUser.getId())
                .departmentId(parent.getDepartmentId())
                .parent(parent)
                .build();

        Ticket saved = ticketRepository.save(child);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(toSummary(saved)));
    }

    @PutMapping("/{id}/parent")
    @PreAuthorize("hasAnyRole('AGENT', 'TEAM_LEAD', 'ADMIN')")
    @Transactional
    public ResponseEntity<ApiResponse<TicketSummaryDto>> setParent(
            @PathVariable UUID id,
            @RequestBody Map<String, Object> body) {
        Ticket ticket = ticketRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket", id));

        Object parentIdObj = body.get("parentTicketId");
        if (parentIdObj == null) {
            ticket.setParent(null);
            ticketRepository.save(ticket);
            return ResponseEntity.ok(ApiResponse.ok(toSummary(ticket)));
        }

        UUID parentId = UUID.fromString(parentIdObj.toString());
        if (parentId.equals(id)) {
            return ResponseEntity.badRequest().body(ApiResponse.error("A ticket cannot be its own parent"));
        }

        Ticket parent = ticketRepository.findByIdAndDeletedAtIsNull(parentId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket", parentId));
        ticket.setParent(parent);
        ticketRepository.save(ticket);
        return ResponseEntity.ok(ApiResponse.ok(toSummary(parent)));
    }

    @DeleteMapping("/{id}/parent")
    @PreAuthorize("hasAnyRole('AGENT', 'TEAM_LEAD', 'ADMIN')")
    @Transactional
    public ResponseEntity<ApiResponse<Void>> removeParent(@PathVariable UUID id) {
        Ticket ticket = ticketRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket", id));
        ticket.setParent(null);
        ticketRepository.save(ticket);
        return ResponseEntity.ok(ApiResponse.ok("Parent link removed", null));
    }

    private TicketSummaryDto toSummary(Ticket ticket) {
        String assignedToName = null;
        if (ticket.getAssignedAgentId() != null) {
            assignedToName = userRepository.findById(ticket.getAssignedAgentId())
                    .map(User::getFullName)
                    .orElse(null);
        }
        return new TicketSummaryDto(
                ticket.getId(),
                ticket.getTicketNumber(),
                ticket.getTitle(),
                ticket.getStatus(),
                ticket.getPriority(),
                assignedToName
        );
    }
}
