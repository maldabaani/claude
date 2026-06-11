package com.helpdesk.domain.ticketlink;

import com.helpdesk.domain.ticket.entity.TicketStatus;

import java.util.UUID;

public record TicketLinkResponse(
        UUID id,
        UUID linkedTicketId,
        String linkedTicketNumber,
        String linkedTicketSubject,
        TicketStatus linkedTicketStatus,
        LinkType linkType,
        String direction
) {}
