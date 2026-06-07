package com.helpdesk.domain.ticket.service;

import com.helpdesk.domain.notification.service.NotificationService;
import com.helpdesk.domain.sla.repository.SlaPolicyRepository;
import com.helpdesk.domain.ticket.dto.CreateTicketRequest;
import com.helpdesk.domain.ticket.dto.TicketResponse;
import com.helpdesk.domain.ticket.dto.UpdateTicketRequest;
import com.helpdesk.domain.ticket.entity.Priority;
import com.helpdesk.domain.ticket.entity.Ticket;
import com.helpdesk.domain.ticket.entity.TicketStatus;
import com.helpdesk.domain.ticket.repository.TicketRepository;
import com.helpdesk.domain.ticket.repository.TicketSpecification;
import com.helpdesk.domain.user.entity.User;
import com.helpdesk.domain.user.repository.UserRepository;
import com.helpdesk.domain.user.service.UserService;
import com.helpdesk.shared.exception.InvalidStateTransitionException;
import com.helpdesk.shared.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import com.helpdesk.domain.ticket.dto.BulkTicketRequest;

@Service
@RequiredArgsConstructor
public class TicketService {

    private final TicketRepository ticketRepository;
    private final UserRepository userRepository;
    private final SlaPolicyRepository slaPolicyRepository;
    private final TicketNumberGenerator ticketNumberGenerator;
    private final NotificationService notificationService;
    private final UserService userService;

    @Transactional
    public TicketResponse create(CreateTicketRequest request, User currentUser) {
        Priority priority = request.priority() != null ? request.priority() : Priority.MEDIUM;

        Ticket ticket = Ticket.builder()
                .ticketNumber(ticketNumberGenerator.generate())
                .title(request.title())
                .description(request.description())
                .priority(priority)
                .category(request.category())
                .departmentId(request.departmentId())
                .createdById(currentUser.getId())
                .tags(request.tags() != null ? request.tags() : List.of())
                .build();

        slaPolicyRepository.findByPriorityAndDeletedAtIsNull(priority).ifPresent(sla -> {
            ticket.setSlaPolicyId(sla.getId());
            ticket.setDueDate(Instant.now().plus(sla.getResolutionTimeHours(), ChronoUnit.HOURS));
        });

        autoAssign(ticket);
        Ticket saved = ticketRepository.save(ticket);
        notificationService.notifyTicketCreated(saved);
        return toResponse(saved);
    }

    public Page<TicketResponse> findAll(TicketStatus status, Priority priority, UUID departmentId,
                                        UUID agentId, UUID createdById, Instant from, Instant to, Pageable pageable) {
        return ticketRepository.findAll(
                TicketSpecification.filtered(status, priority, departmentId, agentId, createdById, from, to), pageable)
                .map(this::toResponse);
    }

    public TicketResponse findById(UUID id) {
        return toResponse(getTicket(id));
    }

    @Transactional
    public TicketResponse update(UUID id, UpdateTicketRequest request) {
        Ticket ticket = getTicket(id);
        if (request.title() != null) ticket.setTitle(request.title());
        if (request.description() != null) ticket.setDescription(request.description());
        if (request.priority() != null) ticket.setPriority(request.priority());
        if (request.category() != null) ticket.setCategory(request.category());
        if (request.departmentId() != null) ticket.setDepartmentId(request.departmentId());
        if (request.tags() != null) ticket.setTags(request.tags());
        return toResponse(ticketRepository.save(ticket));
    }

    @Transactional
    public TicketResponse assign(UUID id, UUID agentId) {
        Ticket ticket = getTicket(id);
        ticket.setAssignedAgentId(agentId);
        if (ticket.getStatus() == TicketStatus.NEW) {
            ticket.setStatus(TicketStatus.OPEN);
        }
        Ticket saved = ticketRepository.save(ticket);
        notificationService.notifyTicketAssigned(saved);
        return toResponse(saved);
    }

    @Transactional
    public TicketResponse changeStatus(UUID id, TicketStatus newStatus) {
        Ticket ticket = getTicket(id);
        if (!ticket.getStatus().canTransitionTo(newStatus)) {
            throw new InvalidStateTransitionException(ticket.getStatus().name(), newStatus.name());
        }
        ticket.setStatus(newStatus);
        if (newStatus == TicketStatus.RESOLVED) ticket.setResolvedAt(Instant.now());
        if (newStatus == TicketStatus.CLOSED) ticket.setClosedAt(Instant.now());
        Ticket saved = ticketRepository.save(ticket);
        notificationService.notifyStatusChanged(saved);
        return toResponse(saved);
    }

    @Transactional
    public void delete(UUID id) {
        Ticket ticket = getTicket(id);
        ticket.softDelete();
        ticketRepository.save(ticket);
    }

    @Transactional
    public Map<String, Object> bulkAction(BulkTicketRequest request) {
        int processed = 0;
        for (UUID id : request.ticketIds()) {
            try {
                switch (request.action()) {
                    case "RESOLVE" -> changeStatus(id, TicketStatus.RESOLVED);
                    case "CLOSE"   -> changeStatus(id, TicketStatus.CLOSED);
                    case "ASSIGN"  -> { if (request.agentId() != null) assign(id, request.agentId()); }
                    case "TAG"     -> {
                        if (request.tag() != null && !request.tag().isBlank()) {
                            Ticket t = getTicket(id);
                            if (!t.getTags().contains(request.tag())) {
                                List<String> tags = new java.util.ArrayList<>(t.getTags());
                                tags.add(request.tag());
                                t.setTags(tags);
                                ticketRepository.save(t);
                            }
                        }
                    }
                }
                processed++;
            } catch (Exception ignored) {}
        }
        return Map.of("processed", processed, "total", request.ticketIds().size());
    }

    private void autoAssign(Ticket ticket) {
        if (ticket.getDepartmentId() == null) return;
        List<User> agents = userRepository.findActiveAgentsByDepartment(ticket.getDepartmentId());
        if (agents.isEmpty()) return;
        List<Object[]> loads = ticketRepository.findAgentLoadByDepartment(ticket.getDepartmentId());
        UUID leastLoaded = loads.isEmpty() ? agents.get(0).getId() : (UUID) loads.get(0)[0];
        ticket.setAssignedAgentId(leastLoaded);
        ticket.setStatus(TicketStatus.OPEN);
    }

    public Ticket getTicket(UUID id) {
        return ticketRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket", id));
    }

    public TicketResponse toResponse(Ticket ticket) {
        return new TicketResponse(
                ticket.getId(), ticket.getTicketNumber(), ticket.getTitle(), ticket.getDescription(),
                ticket.getStatus(), ticket.getPriority(), ticket.getCategory(), ticket.getDepartmentId(),
                ticket.getAssignedAgentId() != null
                        ? userRepository.findById(ticket.getAssignedAgentId()).map(userService::toResponse).orElse(null)
                        : null,
                userRepository.findById(ticket.getCreatedById()).map(userService::toResponse).orElse(null),
                ticket.getSlaPolicyId(), ticket.getDueDate(), ticket.getFirstResponseAt(),
                ticket.getResolvedAt(), ticket.getClosedAt(), ticket.isSlaBreached(),
                ticket.getTags(), ticket.getCreatedAt(), ticket.getUpdatedAt()
        );
    }
}
