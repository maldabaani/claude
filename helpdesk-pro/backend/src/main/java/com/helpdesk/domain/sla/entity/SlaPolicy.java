package com.helpdesk.domain.sla.entity;

import com.helpdesk.domain.ticket.entity.Priority;
import com.helpdesk.shared.audit.AuditableEntity;
import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "sla_policies")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SlaPolicy extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String name;

    @Column(name = "response_time_hours", nullable = false)
    private int responseTimeHours;

    @Column(name = "resolution_time_hours", nullable = false)
    private int resolutionTimeHours;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Priority priority;

    @Column(name = "business_hours_only", nullable = false)
    @Builder.Default
    private boolean businessHoursOnly = false;
}
