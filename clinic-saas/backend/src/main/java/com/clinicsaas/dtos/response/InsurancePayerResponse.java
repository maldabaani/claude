package com.clinicsaas.dtos.response;

import com.clinicsaas.entities.tenant.InsurancePayer;

import java.util.UUID;

public record InsurancePayerResponse(
        UUID id,
        String name,
        String shortCode,
        String contactEmail,
        String portalUrl,
        boolean active
) {
    public static InsurancePayerResponse from(InsurancePayer payer) {
        return new InsurancePayerResponse(
                payer.getId(),
                payer.getName(),
                payer.getShortCode(),
                payer.getContactEmail(),
                payer.getPortalUrl(),
                payer.isActive()
        );
    }
}
