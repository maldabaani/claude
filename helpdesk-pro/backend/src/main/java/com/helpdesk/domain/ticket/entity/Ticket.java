package com.helpdesk.domain.ticket.entity;

import com.helpdesk.shared.audit.AuditableEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "tickets")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Ticket extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "ticket_number", unique = true, nullable = false)
    private String ticketNumber;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private TicketStatus status = TicketStatus.NEW;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private Priority priority = Priority.MEDIUM;

    private String category;

    @Column(name = "department_id")
    private UUID departmentId;

    @Column(name = "assigned_agent_id")
    private UUID assignedAgentId;

    @Column(name = "created_by_id", nullable = false)
    private UUID createdById;

    @Column(name = "sla_policy_id")
    private UUID slaPolicyId;

    @Column(name = "due_date")
    private Instant dueDate;

    @Column(name = "first_response_at")
    private Instant firstResponseAt;

    @Column(name = "resolved_at")
    private Instant resolvedAt;

    @Column(name = "closed_at")
    private Instant closedAt;

    @Column(name = "sla_breached")
    @Builder.Default
    private boolean slaBreached = false;

    @Column(name = "manual_due_date")
    private Instant manualDueDate;

    @ElementCollection
    @CollectionTable(name = "ticket_tags", joinColumns = @JoinColumn(name = "ticket_id"))
    @Column(name = "tag")
    @Builder.Default
    private List<String> tags = new ArrayList<>();


    @Column(name = "snoozed_until")
    private LocalDateTime snoozedUntil;

    @Column(name = "snoozed_by_id")
    private UUID snoozedById;

    @Column(name = "pre_snooze_status")
    private String preSnoozeStatus;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_ticket_id")
    private Ticket parent;

    @OneToMany(mappedBy = "parent", fetch = FetchType.LAZY)
    @Builder.Default
    private List<Ticket> children = new ArrayList<>();

    @Version
    private Long version;


    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "split_from_id")
    private Ticket splitFrom;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "team_id")
    private com.helpdesk.domain.team.Team team;
}
