package com.helpdesk.domain.analytics.dto;

public record AgentPerformanceDto(
    String agentId,
    String agentName,
    String agentEmail,
    String availabilityStatus,
    long ticketsResolved,
    long ticketsOpen,
    double avgFirstResponseMinutes,
    double avgResolutionMinutes,
    double csatScore
) {}
