package com.helpdesk.domain.helptopic;

import com.helpdesk.domain.department.entity.Department;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "help_topics")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HelpTopic {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String name;

    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id")
    private Department department;

    @Column(name = "default_priority")
    @Builder.Default
    private String defaultPriority = "MEDIUM";

    @Column(name = "auto_assign_team_lead")
    @Builder.Default
    private boolean autoAssignTeamLead = false;

    @Builder.Default
    private boolean active = true;

    @Column(name = "display_order")
    @Builder.Default
    private int displayOrder = 0;

    @Column(name = "created_at")
    @Builder.Default
    private Instant createdAt = Instant.now();
}
