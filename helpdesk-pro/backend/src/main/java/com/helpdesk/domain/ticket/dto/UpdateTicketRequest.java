package com.helpdesk.domain.ticket.dto;

import com.helpdesk.domain.ticket.entity.Priority;

import java.util.List;
import java.util.UUID;

public record UpdateTicketRequest(
        String title,
        String description,
        Priority priority,
        String category,
        UUID departmentId,
        List<String> tags
) {}
