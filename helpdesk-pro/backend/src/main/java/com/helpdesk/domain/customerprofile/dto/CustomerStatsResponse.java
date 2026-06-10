package com.helpdesk.domain.customerprofile.dto;

public record CustomerStatsResponse(
        long totalTickets,
        long openTickets,
        long resolvedTickets,
        Double avgCsat,
        long totalTimeLoggedMinutes
) {}
