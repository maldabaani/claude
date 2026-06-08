package com.helpdesk.domain.issue;

import lombok.*;

import java.io.Serializable;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
public class IssueTicketId implements Serializable {
    private UUID issueId;
    private UUID ticketId;
}
