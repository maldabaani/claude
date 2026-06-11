package com.helpdesk.domain.tag;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "ticket_tag_links")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@IdClass(TicketTagLinkId.class)
public class TicketTagLink {

    @Id
    @Column(name = "ticket_id")
    private UUID ticketId;

    @Id
    @Column(name = "tag_id")
    private UUID tagId;
}
