package com.helpdesk.domain.comment.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateCommentRequest(
        @NotBlank(message = "Comment body is required") String body,
        boolean internal
) {}
