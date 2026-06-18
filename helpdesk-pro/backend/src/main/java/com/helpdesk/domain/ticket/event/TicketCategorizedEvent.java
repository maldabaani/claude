package com.helpdesk.domain.ticket.event;

import java.util.UUID;

public record TicketCategorizedEvent(UUID ticketId, String category) {
}
