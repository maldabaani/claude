package com.helpdesk.domain.roundrobin;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "round_robin_config")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoundRobinConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "department_id")
    private UUID departmentId;

    @Column(name = "is_enabled", nullable = false)
    private boolean isEnabled;

    @Column(name = "last_assigned_agent_id")
    private UUID lastAssignedAgentId;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    @Builder.Default
    private Instant updatedAt = Instant.now();

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = Instant.now();
    }
}
