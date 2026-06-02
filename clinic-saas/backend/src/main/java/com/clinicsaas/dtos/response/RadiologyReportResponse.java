package com.clinicsaas.dtos.response;

import com.clinicsaas.entities.enums.RadiologyReportStatus;
import com.clinicsaas.entities.tenant.RadiologyReport;

import java.time.LocalDateTime;
import java.util.UUID;

public record RadiologyReportResponse(
        UUID id,
        String findings,
        String impression,
        String recommendation,
        RadiologyReportStatus status,
        LocalDateTime reportedAt
) {
    public static RadiologyReportResponse from(RadiologyReport r) {
        return new RadiologyReportResponse(
                r.getId(),
                r.getFindings(),
                r.getImpression(),
                r.getRecommendation(),
                r.getStatus(),
                r.getReportedAt()
        );
    }
}
