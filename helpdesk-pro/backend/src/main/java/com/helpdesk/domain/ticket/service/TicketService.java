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
import com.helpdesk.domain.ticket.dto.TicketSplitRequest;
import com.helpdesk.domain.audit.service.AuditLogService;
import com.helpdesk.domain.comment.entity.Comment;
import com.helpdesk.domain.comment.repository.CommentRepository;
import com.helpdesk.domain.helptopic.HelpTopic;
import com.helpdesk.domain.helptopic.HelpTopicRepository;
import com.helpdesk.domain.roundrobin.RoundRobinService;
import com.helpdesk.domain.ticket.event.TicketCategorizedEvent;
import org.springframework.context.ApplicationEventPublisher;

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
    private final HelpTopicRepository helpTopicRepository;
    private final RoundRobinService roundRobinService;
    private final com.helpdesk.domain.team.TeamRepository teamRepository;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional
    public TicketResponse create(CreateTicketRequest request, User currentUser) {
        Priority priority = request.priority() != null ? request.priority() : Priority.MEDIUM;
        UUID departmentId = request.departmentId();

        // Apply help topic defaults if provided
        if (request.helpTopicId() != null) {
            Optional<HelpTopic> helpTopicOpt = helpTopicRepository.findById(request.helpTopicId());
            if (helpTopicOpt.isPresent()) {
                HelpTopic helpTopic = helpTopicOpt.get();
                if (request.priority() == null) {
                    try { priority = Priority.valueOf(helpTopic.getDefaultPriority()); } catch (Exception ignored) {}
                }
                if (departmentId == null && helpTopic.getDepartment() != null) {
                    departmentId = helpTopic.getDepartment().getId();
                }
            }
        }

        Ticket ticket = Ticket.builder()
                .ticketNumber(ticketNumberGenerator.generate())
                .title(request.title())
                .description(request.description())
                .priority(priority)
                .category(request.category())
                .departmentId(departmentId)
                .createdById(currentUser.getId())
                .tags(request.tags() != null ? request.tags() : List.of())
                .build();

        slaPolicyRepository.findByPriorityAndDeletedAtIsNull(priority).ifPresent(sla -> {
            ticket.setSlaPolicyId(sla.getId());
            ticket.setDueDate(Instant.now().plus(sla.getResolutionTimeHours(), ChronoUnit.HOURS));
        });

        autoAssign(ticket);
        roundRobinAssign(ticket);
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
        return findAll(status, priority, departmentId, agentId, createdById, from, to, search, false, pageable);
    }

    public Page<TicketResponse> findAll(TicketStatus status, Priority priority, UUID departmentId,
                                        UUID agentId, UUID createdById, Instant from, Instant to,
                                        String search, boolean includeSnoozed, Pageable pageable) {
        return ticketRepository.findAll(
                TicketSpecification.filtered(status, priority, departmentId, agentId, createdById, from, to, search, includeSnoozed), pageable)
                .map(this::toResponse);
    }

    public Page<TicketResponse> findAll(TicketStatus status, Priority priority, UUID departmentId,
                                        UUID agentId, UUID createdById, Instant from, Instant to,
                                        String search, UUID organizationId, UUID currentUserId,
                                        boolean isCustomer, Pageable pageable) {
        return findAll(status, priority, departmentId, agentId, createdById, from, to, search, organizationId,
                currentUserId, isCustomer, false, pageable);
    }

    public Page<TicketResponse> findAll(TicketStatus status, Priority priority, UUID departmentId,
                                        UUID agentId, UUID createdById, Instant from, Instant to,
                                        String search, UUID organizationId, UUID currentUserId,
                                        boolean isCustomer, boolean includeSnoozed, Pageable pageable) {
        if (isCustomer && organizationId != null) {
            List<UUID> orgUserIds = userRepository.findActiveByOrganizationId(organizationId)
                    .stream().map(User::getId).toList();
            org.springframework.data.jpa.domain.Specification<Ticket> baseSpec =
                TicketSpecification.filtered(status, priority, departmentId, agentId, null, from, to, search, includeSnoozed);
            org.springframework.data.jpa.domain.Specification<Ticket> orgSpec =
                baseSpec.and((r, q, cb) -> r.get("createdById").in(orgUserIds));
            return ticketRepository.findAll(orgSpec, pageable).map(this::toResponse);
        }
        return findAll(status, priority, departmentId, agentId, createdById, from, to, search, includeSnoozed, pageable);
    }

    public TicketResponse findById(UUID id) {
        return toResponse(getTicket(id));
    }

    @Transactional
    public TicketResponse update(UUID id, UpdateTicketRequest request) {
        Ticket ticket = getTicket(id);
        boolean categorizedAsAccount = request.category() != null
                && "account".equalsIgnoreCase(request.category())
                && !"account".equalsIgnoreCase(ticket.getCategory());
        if (request.title() != null) ticket.setTitle(request.title());
        if (request.description() != null) ticket.setDescription(request.description());
        if (request.priority() != null) ticket.setPriority(request.priority());
        if (request.category() != null) ticket.setCategory(request.category());
        if (request.departmentId() != null) ticket.setDepartmentId(request.departmentId());
        if (request.tags() != null) ticket.setTags(request.tags());
        Ticket saved = ticketRepository.save(ticket);
        if (categorizedAsAccount) {
            eventPublisher.publishEvent(new TicketCategorizedEvent(saved.getId(), "account"));
        }
        return toResponse(saved);
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
    public TicketResponse assignTeam(UUID id, UUID teamId) {
        Ticket ticket = getTicket(id);
        if (teamId != null) {
            com.helpdesk.domain.team.Team team = teamRepository.findById(teamId)
                    .orElseThrow(() -> new ResourceNotFoundException("Team", teamId));
            ticket.setTeam(team);
        } else {
            ticket.setTeam(null);
        }
        Ticket saved = ticketRepository.save(ticket);
        auditLogService.log("TICKET", saved.getId(), "TEAM_ASSIGNED", null);
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

    @Transactional
    public void closeByAi(UUID id) {
        Ticket ticket = getTicket(id);
        if (!ticket.getStatus().canTransitionTo(TicketStatus.CLOSED)) return;
        ticket.setStatus(TicketStatus.CLOSED);
        ticket.setClosedAt(Instant.now());
        ticket.setClosedByAi(true);
        Ticket saved = ticketRepository.save(ticket);
        notificationService.notifyStatusChanged(saved);
        auditLogService.log("TICKET", saved.getId(), "STATUS_CHANGED", null, null, "{\"status\":\"CLOSED\",\"closedByAi\":true}");
        webhookService.fireEvent("ticket.updated", toResponse(saved));
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


    private void roundRobinAssign(Ticket ticket) {
        if (ticket.getAssignedAgentId() != null) return;
        roundRobinService.getNextAgent(ticket.getDepartmentId()).ifPresent(agentId -> {
            ticket.setAssignedAgentId(agentId);
            ticket.setStatus(TicketStatus.OPEN);
        });
    }

    @Transactional
    public TicketResponse updateManualDueDate(UUID id, Instant dueDate) {
        Ticket ticket = getTicket(id);
        ticket.setManualDueDate(dueDate);
        return toResponse(ticketRepository.save(ticket));
    }

    public Ticket getTicket(UUID id) {
        return ticketRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket", id));
    }

    public TicketResponse toResponse(Ticket ticket) {
        com.helpdesk.domain.team.Team team = ticket.getTeam();
        Ticket splitFrom = ticket.getSplitFrom();
        return new TicketResponse(
                ticket.getId(), ticket.getTicketNumber(), ticket.getTitle(), ticket.getDescription(),
                ticket.getStatus(), ticket.getPriority(), ticket.getCategory(), ticket.getDepartmentId(),
                ticket.getAssignedAgentId() != null
                        ? userRepository.findById(ticket.getAssignedAgentId()).map(userService::toResponse).orElse(null)
                        : null,
                userRepository.findById(ticket.getCreatedById()).map(userService::toResponse).orElse(null),
                ticket.getSlaPolicyId(), ticket.getDueDate(), ticket.getFirstResponseAt(),
                ticket.getResolvedAt(), ticket.getClosedAt(), ticket.isSlaBreached(),
                ticket.getTags(), ticket.getCreatedAt(), ticket.getUpdatedAt(),
                ticket.getManualDueDate(),
                ticket.getSnoozedUntil(),
                ticket.getPreSnoozeStatus(),
                team != null ? team.getId() : null,
                team != null ? team.getName() : null,
                team != null ? team.getColor() : null,
                splitFrom != null ? splitFrom.getId() : null,
                splitFrom != null ? splitFrom.getTicketNumber() : null,
                ticket.isClosedByAi()
        );
    }


    @Transactional
    public TicketResponse splitTicket(UUID sourceId, TicketSplitRequest request, UUID actorId) {
        Ticket source = getTicket(sourceId);

        Priority priority = request.getPriority() != null
                ? Priority.valueOf(request.getPriority())
                : source.getPriority();

        Ticket newTicket = Ticket.builder()
                .ticketNumber(ticketNumberGenerator.generate())
                .title(request.getSubject() != null ? request.getSubject() : "Split: " + source.getTitle())
                .description(request.getDescription() != null ? request.getDescription() : "")
                .priority(priority)
                .departmentId(request.getDepartmentId() != null ? request.getDepartmentId() : source.getDepartmentId())
                .createdById(source.getCreatedById())
                .splitFrom(source)
                .build();

        Ticket saved = ticketRepository.save(newTicket);

        // Optionally move specified comments to the new ticket
        if (request.getCommentIds() != null && !request.getCommentIds().isEmpty()) {
            for (UUID commentId : request.getCommentIds()) {
                commentRepository.findByIdAndDeletedAtIsNull(commentId).ifPresent(c -> {
                    c.setTicketId(saved.getId());
                    commentRepository.save(c);
                });
            }
        }

        // Add internal note on original ticket
        Comment noteOnSource = Comment.builder()
                .ticketId(sourceId)
                .authorId(actorId)
                .body("This ticket was split into #" + saved.getTicketNumber())
                .internal(true)
                .build();
        commentRepository.save(noteOnSource);

        // Add internal note on new ticket
        Comment noteOnNew = Comment.builder()
                .ticketId(saved.getId())
                .authorId(actorId)
                .body("Split from ticket #" + source.getTicketNumber())
                .internal(true)
                .build();
        commentRepository.save(noteOnNew);

        auditLogService.log("TICKET", sourceId, "SPLIT", actorId, null, "{\"newTicketId\":\"" + saved.getId() + "\"}");        return toResponse(saved);
    }

    @Transactional
    public TicketResponse snooze(UUID id, java.time.LocalDateTime snoozeUntil, UUID currentUserId) {
        Ticket ticket = getTicket(id);
        if (snoozeUntil != null) {
            ticket.setPreSnoozeStatus(ticket.getStatus().name());
            ticket.setStatus(TicketStatus.SNOOZED);
            ticket.setSnoozedUntil(snoozeUntil);
            ticket.setSnoozedById(currentUserId);
        } else {
            String restore = ticket.getPreSnoozeStatus();
            TicketStatus restoreStatus = (restore != null && !restore.isBlank())
                    ? TicketStatus.valueOf(restore) : TicketStatus.OPEN;
            ticket.setStatus(restoreStatus);
            ticket.setSnoozedUntil(null);
            ticket.setSnoozedById(null);
            ticket.setPreSnoozeStatus(null);
        }
        return toResponse(ticketRepository.save(ticket));
    }
}
