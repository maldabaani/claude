package com.helpdesk.domain.automation;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "automation_rules")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AutomationRule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    @Builder.Default
    private boolean active = true;

    @Column(name = "trigger_type", nullable = false)
    private String triggerType;

    @Column(name = "trigger_event")
    private String triggerEvent;

    @Column(name = "trigger_hours")
    private Integer triggerHours;

    @Column(columnDefinition = "jsonb")
    @Builder.Default
    private String conditions = "[]";

    @Column(columnDefinition = "jsonb")
    @Builder.Default
    private String actions = "[]";

    @Column(name = "run_order", nullable = false)
    @Builder.Default
    private int runOrder = 0;

    @Column(name = "created_at")
    @Builder.Default
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at")
    @Builder.Default
    private Instant updatedAt = Instant.now();

    @Column(nullable = false)
    @Builder.Default
    private boolean deleted = false;
}
