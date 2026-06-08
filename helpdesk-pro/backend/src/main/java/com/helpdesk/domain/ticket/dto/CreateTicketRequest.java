package com.helpdesk.domain.ticket.dto;

import com.helpdesk.domain.ticket.entity.Priority;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;
import java.util.UUID;

public record CreateTicketRequest(
        @NotBlank(message = "Title is required")
        @Size(max = 500, message = "Title must not exceed 500 characters")
        String title,

        @NotBlank(message = "Description is required")
        String description,

        Priority priority,
        String category,
        UUID departmentId,
        List<String> tags,
        UUID helpTopicId
) {}
