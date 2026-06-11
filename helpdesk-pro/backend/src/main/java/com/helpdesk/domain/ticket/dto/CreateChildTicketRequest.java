package com.helpdesk.domain.ticket.dto;

import com.helpdesk.domain.ticket.entity.Priority;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateChildTicketRequest(
        @NotBlank(message = "Subject is required")
        @Size(max = 500, message = "Subject must not exceed 500 characters")
        String subject,

        @NotBlank(message = "Description is required")
        String description,

        Priority priority
) {}
