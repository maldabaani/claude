package com.clinicsaas.dtos.response;

public record DashboardStatsResponse(
        long totalPatients,
        long todayAppointments,
        long activeVisits,
        long completedToday
) {}
