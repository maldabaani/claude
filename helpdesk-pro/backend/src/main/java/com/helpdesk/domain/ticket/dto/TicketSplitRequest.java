package com.helpdesk.domain.ticket.dto;

import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
public class TicketSplitRequest {
    private String subject;
    private String description;
    private UUID departmentId;
    private String priority;
    private List<UUID> commentIds;
}
