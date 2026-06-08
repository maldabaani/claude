package com.helpdesk.domain.ticket.service;

import com.helpdesk.domain.csat.repository.CsatRatingRepository;
import com.helpdesk.domain.notification.service.NotificationService;
import com.helpdesk.domain.settings.repository.SystemSettingRepository;
import com.helpdesk.domain.webhook.WebhookService;
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
import com.helpdesk.domain.audit.service.AuditLogService;
import com.helpdesk.domain.comment.entity.Comment;
import com.helpdesk.domain.comment.repository.CommentRepository;

@Service
@RequiredArgsConstructor
public class TicketService {

    private final TicketRepository ticketRepository;
    private final UserRepository userRepository;
    private final SlaPolicyRepository slaPolicyRepository;
    private final TicketNumberGenerator ticketNumberGenerator;
    private final NotificationService notificationService;
    private final UserService userService;
    private final AuditLogService auditLogService;
    private final CommentRepository commentRepository;
    private final CsatRatingRepository csatRatingRepository;
    private final SystemSettingRepository systemSettingRepository;
    private final WebhookService webhookService;

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
        auditLogService.log("TICKET", saved.getId(), "CREATED", currentUser.getId());
        webhookService.fireEvent("ticket.created", toResponse(saved));
        return toResponse(saved);
    }

    public Page<TicketResponse> findAll(TicketStatus status, Priority priority, UUID departmentId,
                                        UUID agentId, UUID createdById, Instant from, Instant to, Pageable pageable) {
        return findAll(status, priority, departmentId, agentId, createdById, from, to, null, pageable);
    }

    public Page<TicketResponse> findAll(TicketStatus status, Priority priority, UUID departmentId,
                                        UUID agentId, UUID createdById, Instant from, Instant to,
                                        String search, Pageable pageable) {
        return ticketRepository.findAll(
                TicketSpecification.filtered(status, priority, departmentId, agentId, createdById, from, to, search), pageable)
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
        auditLogService.log("TICKET", saved.getId(), "ASSIGNED", agentId);
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
        auditLogService.log("TICKET", saved.getId(), "STATUS_CHANGED", null, null, "{\"status\":\"" + newStatus.name() + "\"}");
        webhookService.fireEvent("ticket.updated", toResponse(saved));
        if (newStatus == TicketStatus.RESOLVED || newStatus == TicketStatus.CLOSED) {
            boolean noRating = csatRatingRepository.findByTicketId(saved.getId()).isEmpty();
            if (noRating) {
                try { notificationService.sendCsatSurvey(saved); } catch (Exception e) {}
            }
        }
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

    @Transactional
    public TicketResponse mergeTicket(UUID sourceId, UUID targetId, UUID actorId) {
        Ticket source = getTicket(sourceId);
        Ticket target = getTicket(targetId);

        // Move all comments from source to target
        List<Comment> comments = commentRepository.findByTicketId(sourceId, true);
        for (Comment c : comments) {
            c.setTicketId(targetId);
        }
        commentRepository.saveAll(comments);

        // Add a system comment on the source ticket
        Comment mergeNote = Comment.builder()
                .ticketId(sourceId)
                .authorId(actorId)
                .body("Merged into ticket #" + target.getTicketNumber())
                .internal(false)
                .build();
        commentRepository.save(mergeNote);

        // Close source ticket
        source.setStatus(TicketStatus.CLOSED);
        source.setClosedAt(Instant.now());
        ticketRepository.save(source);

        auditLogService.log("TICKET", sourceId, "MERGED", actorId, null, "{\"targetTicketId\":\"" + targetId + "\"}");
        return toResponse(target);
    }

    private void autoAssign(Ticket ticket) {
        boolean enabled = Boolean.parseBoolean(
            systemSettingRepository.findById("autoAssignTickets").map(s -> s.getValue()).orElse("false"));
        if (!enabled) return;

        List<User> agents;
        if (ticket.getDepartmentId() != null) {
            agents = userRepository.findActiveAgentsByDepartment(ticket.getDepartmentId());
        } else {
            agents = userRepository.findAllActiveAgents();
        }
        if (agents.isEmpty()) return;

        // Find agent with fewest open tickets
        UUID leastLoadedAgent = agents.stream()
            .min(java.util.Comparator.comparingLong(a -> ticketRepository.countOpenByAgent(a.getId())))
            .map(User::getId)
            .orElse(null);
        if (leastLoadedAgent == null) return;
        ticket.setAssignedAgentId(leastLoadedAgent);
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
