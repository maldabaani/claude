package com.helpdesk.domain.customerprofile.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateCustomerNoteRequest(
        @NotBlank String content
) {}
