package com.helpdesk.domain.tag;

import lombok.*;

import java.io.Serializable;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
public class TicketTagLinkId implements Serializable {
    private UUID ticketId;
    private UUID tagId;
}
