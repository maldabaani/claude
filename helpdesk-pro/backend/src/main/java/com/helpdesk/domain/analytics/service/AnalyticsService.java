package com.helpdesk.domain.analytics.service;

import com.helpdesk.domain.analytics.dto.AnalyticsResponse;
import com.helpdesk.domain.ticket.entity.TicketStatus;
import com.helpdesk.domain.ticket.repository.TicketRepository;
import com.helpdesk.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final TicketRepository ticketRepository;
    private final UserRepository userRepository;

    public AnalyticsResponse getAnalytics(int days) {
        Instant since = Instant.now().minus(days, ChronoUnit.DAYS);
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("MMM dd").withZone(ZoneId.systemDefault());

        List<AnalyticsResponse.DailyCount> daily = ticketRepository.countByDay(since).stream()
            .map(row -> {
                Instant instant;
                Object dateVal = row[0];
                if (dateVal instanceof java.sql.Timestamp ts) {
                    instant = ts.toInstant();
                } else if (dateVal instanceof java.time.LocalDateTime ldt) {
                    instant = ldt.atZone(ZoneId.systemDefault()).toInstant();
                } else if (dateVal instanceof java.time.LocalDate ld) {
                    instant = ld.atStartOfDay(ZoneId.systemDefault()).toInstant();
                } else {
                    instant = Instant.parse(dateVal.toString());
                }
                return new AnalyticsResponse.DailyCount(fmt.format(instant), ((Number) row[1]).longValue());
            }).toList();

        double avgRes = ticketRepository.avgResolutionHours(since) != null
            ? Math.round(ticketRepository.avgResolutionHours(since) * 10.0) / 10.0 : 0.0;

        long total = ticketRepository.count();
        long resolved = ticketRepository.countByStatus(TicketStatus.RESOLVED)
                      + ticketRepository.countByStatus(TicketStatus.CLOSED);
        double rate = total > 0 ? Math.round((resolved * 100.0 / total) * 10.0) / 10.0 : 0.0;

        List<AnalyticsResponse.AgentStat> agentStats = ticketRepository.agentStats().stream()
            .map(row -> {
                UUID agentId = (UUID) row[0];
                long agentTotal = ((Number) row[1]).longValue();
                long agentResolved = ((Number) row[2]).longValue();
                double agentRate = agentTotal > 0 ? Math.round((agentResolved * 100.0 / agentTotal) * 10.0) / 10.0 : 0.0;
                String name = userRepository.findById(agentId)
                    .map(u -> u.getFullName()).orElse("Unknown");
                return new AnalyticsResponse.AgentStat(agentId.toString(), name, agentTotal, agentResolved, agentRate);
            }).toList();

        return new AnalyticsResponse(daily, avgRes, total, resolved, rate, agentStats);
    }
}
