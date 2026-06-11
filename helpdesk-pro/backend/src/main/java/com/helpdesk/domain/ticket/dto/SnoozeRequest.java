package com.helpdesk.domain.ticket.dto;

import java.time.LocalDateTime;

public record SnoozeRequest(LocalDateTime snoozeUntil) {}
