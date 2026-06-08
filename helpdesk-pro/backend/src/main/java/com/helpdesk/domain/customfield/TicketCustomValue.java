package com.helpdesk.domain.customfield;

import jakarta.persistence.*;
import lombok.*;

import java.io.Serializable;
import java.util.UUID;

@Entity
@Table(name = "ticket_custom_values")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TicketCustomValue {

    @EmbeddedId
    private TicketCustomValueId id;

    @Column(columnDefinition = "TEXT")
    private String value;

    @Embeddable
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @EqualsAndHashCode
    public static class TicketCustomValueId implements Serializable {
        @Column(name = "ticket_id")
        private UUID ticketId;

        @Column(name = "field_key")
        private String fieldKey;
    }
}
