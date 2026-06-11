package com.helpdesk.domain.nps.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "nps_responses")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NpsResponse {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "ticket_id", nullable = false, unique = true)
    private UUID ticketId;

    @Column(name = "customer_id", nullable = false)
    private UUID customerId;

    @Column(nullable = false)
    private int score;

    @Column(columnDefinition = "TEXT")
    private String comment;

    @Column(name = "submitted_at")
    private Instant submittedAt;

    @PrePersist
    public void prePersist() {
        submittedAt = Instant.now();
    }
}
