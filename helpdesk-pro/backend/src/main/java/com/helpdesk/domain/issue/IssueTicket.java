package com.helpdesk.domain.issue;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "issue_tickets")
@IdClass(IssueTicketId.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class IssueTicket {

    @Id
    @Column(name = "issue_id")
    private UUID issueId;

    @Id
    @Column(name = "ticket_id")
    private UUID ticketId;
}
