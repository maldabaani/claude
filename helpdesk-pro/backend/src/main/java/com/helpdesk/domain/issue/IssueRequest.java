package com.helpdesk.domain.issue;

import java.util.UUID;

public record IssueRequest(
        String title,
        String description,
        String status,
        String priority,
        UUID assignedTo
) {}
