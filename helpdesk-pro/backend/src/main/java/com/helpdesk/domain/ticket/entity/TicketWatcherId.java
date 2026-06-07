package com.helpdesk.domain.ticket.entity;

import lombok.*;

import java.io.Serializable;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
public class TicketWatcherId implements Serializable {
    private UUID ticketId;
    private String email;
}
