package com.helpdesk.domain.csat.dto;

import java.util.Map;

public record CsatStatsResponse(double avgRating, long totalRatings, Map<Integer, Long> distribution) {}
