package com.helpdesk.domain.ticket.dto;

import com.helpdesk.domain.ticket.entity.Priority;
import com.helpdesk.domain.ticket.entity.TicketStatus;
import com.helpdesk.domain.user.dto.UserResponse;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record TicketResponse(
        UUID id,
        String ticketNumber,
        String title,
        String description,
        TicketStatus status,
        Priority priority,
        String category,
        UUID departmentId,
        UserResponse assignedAgent,
        UserResponse createdBy,
        UUID slaPolicyId,
        Instant dueDate,
        Instant firstResponseAt,
        Instant resolvedAt,
        Instant closedAt,
        boolean slaBreached,
        List<String> tags,
        Instant createdAt,
        Instant updatedAt
) {}
