package com.clinicsaas.dtos.response;

import com.clinicsaas.entities.tenant.InsurancePolicy;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

public record InsurancePolicyResponse(
        UUID id,
        UUID patientId,
        UUID payerId,
        String payerName,
        String shortCode,
        String policyNumber,
        String memberNumber,
        String groupNumber,
        String coverageType,
        LocalDate validFrom,
        LocalDate validTo,
        BigDecimal copayAmount,
        BigDecimal deductibleAmount,
        BigDecimal coveragePercentage,
        boolean active,
        String notes,
        LocalDateTime createdAt
) {
    public static InsurancePolicyResponse from(InsurancePolicy policy) {
        return new InsurancePolicyResponse(
                policy.getId(),
                policy.getPatient() != null ? policy.getPatient().getId() : null,
                policy.getPayer() != null ? policy.getPayer().getId() : null,
                policy.getPayer() != null ? policy.getPayer().getName() : null,
                policy.getPayer() != null ? policy.getPayer().getShortCode() : null,
                policy.getPolicyNumber(),
                policy.getMemberNumber(),
                policy.getGroupNumber(),
                policy.getCoverageType(),
                policy.getValidFrom(),
                policy.getValidTo(),
                policy.getCopayAmount(),
                policy.getDeductibleAmount(),
                policy.getCoveragePercentage(),
                policy.isActive(),
                policy.getNotes(),
                policy.getCreatedAt()
        );
    }
}
