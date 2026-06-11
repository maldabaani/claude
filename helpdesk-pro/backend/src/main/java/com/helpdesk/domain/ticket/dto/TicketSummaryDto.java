package com.helpdesk.domain.ticket.dto;

import com.helpdesk.domain.ticket.entity.Priority;
import com.helpdesk.domain.ticket.entity.TicketStatus;

import java.util.UUID;

public record TicketSummaryDto(
        UUID id,
        String ticketNumber,
        String subject,
        TicketStatus status,
        Priority priority,
        String assignedToName
) {}
