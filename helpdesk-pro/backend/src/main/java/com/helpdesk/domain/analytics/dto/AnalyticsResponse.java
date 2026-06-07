package com.helpdesk.domain.analytics.dto;
import java.util.List;

public record AnalyticsResponse(
    List<DailyCount> dailyCounts,
    double avgResolutionHours,
    long totalTickets,
    long resolvedTickets,
    double resolutionRate,
    List<AgentStat> agentStats
) {
    public record DailyCount(String date, long count) {}
    public record AgentStat(String agentId, String agentName, long total, long resolved, double resolutionRate) {}
}
