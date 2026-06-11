package com.helpdesk.domain.nps.dto;

public record NpsScoreDto(
    int npsScore,
    long promoters,
    long passives,
    long detractors,
    long total,
    double promoterPct,
    double passivePct,
    double detractorPct
) {}
