package com.helpdesk.domain.timeentry;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "time_entries")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TimeEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "ticket_id", nullable = false)
    private UUID ticketId;

    @Column(name = "agent_id", nullable = false)
    private UUID agentId;

    @Column(nullable = false)
    private Integer minutes;

    @Column(length = 500)
    private String note;

    @Column(name = "logged_at", nullable = false)
    @Builder.Default
    private LocalDateTime loggedAt = LocalDateTime.now();

    @Column(name = "created_at", nullable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
