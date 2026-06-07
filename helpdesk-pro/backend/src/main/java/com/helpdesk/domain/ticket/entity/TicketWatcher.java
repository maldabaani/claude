package com.helpdesk.domain.ticket.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "ticket_watchers")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@IdClass(TicketWatcherId.class)
public class TicketWatcher {

    @Id
    @Column(name = "ticket_id")
    private UUID ticketId;

    @Id
    @Column(name = "email")
    private String email;

    @Column(name = "added_by")
    private UUID addedBy;

    @Column(name = "added_at", nullable = false)
    @Builder.Default
    private Instant addedAt = Instant.now();
}
