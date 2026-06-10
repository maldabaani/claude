package com.helpdesk.domain.analytics.controller;

import com.helpdesk.domain.analytics.dto.AnalyticsResponse;
import com.helpdesk.domain.analytics.service.AnalyticsService;
import com.helpdesk.domain.timeentry.TimeEntryRepository;
import com.helpdesk.shared.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;
    private final TimeEntryRepository timeEntryRepository;

    @GetMapping("/time-summary")
    @PreAuthorize("hasAnyRole('ADMIN','TEAM_LEAD')")
    public ResponseEntity<ApiResponse<java.util.Map<String, Object>>> getTimeSummary() {
        var topTickets = timeEntryRepository.sumMinutesGroupedByTicket().stream()
                .limit(10)
                .map(row -> {
                    java.util.Map<String, Object> m = new java.util.LinkedHashMap<>();
                    m.put("label", row[0].toString());
                    m.put("minutes", ((Number) row[1]).intValue());
                    return m;
                })
                .toList();
        int totalThisMonth = timeEntryRepository.sumMinutesSince(
                java.time.LocalDateTime.now().withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0));
        java.util.Map<String, Object> result = new java.util.LinkedHashMap<>();
        result.put("topTickets", topTickets);
        result.put("totalMinutesThisMonth", totalThisMonth);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','TEAM_LEAD')")
    public ResponseEntity<ApiResponse<AnalyticsResponse>> get(
            @RequestParam(defaultValue = "30") int days) {
        return ResponseEntity.ok(ApiResponse.ok(analyticsService.getAnalytics(days)));
    }
}
