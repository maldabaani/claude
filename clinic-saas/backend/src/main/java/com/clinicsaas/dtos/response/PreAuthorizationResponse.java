package com.clinicsaas.dtos.response;

import com.clinicsaas.entities.enums.PreAuthorizationStatus;
import com.clinicsaas.entities.tenant.PreAuthorization;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

public record PreAuthorizationResponse(
        UUID id,
        String preauthNumber,
        UUID patientId,
        UUID insurancePolicyId,
        String payerName,
        String policyNumber,
        UUID visitId,
        String serviceDescription,
        String icdCode,
        BigDecimal estimatedAmount,
        PreAuthorizationStatus status,
        String approvalNumber,
        LocalDate validUntil,
        String rejectionReason,
        String notes,
        LocalDateTime submittedAt,
        LocalDateTime processedAt,
        UUID requestedBy,
        LocalDateTime createdAt
) {
    public static PreAuthorizationResponse from(PreAuthorization preAuth) {
        var policy = preAuth.getInsurancePolicy();
        return new PreAuthorizationResponse(
                preAuth.getId(),
                preAuth.getPreauthNumber(),
                preAuth.getPatientId(),
                policy != null ? policy.getId() : null,
                policy != null && policy.getPayer() != null ? policy.getPayer().getName() : null,
                policy != null ? policy.getPolicyNumber() : null,
                preAuth.getVisitId(),
                preAuth.getServiceDescription(),
                preAuth.getIcdCode(),
                preAuth.getEstimatedAmount(),
                preAuth.getStatus(),
                preAuth.getApprovalNumber(),
                preAuth.getValidUntil(),
                preAuth.getRejectionReason(),
                preAuth.getNotes(),
                preAuth.getSubmittedAt(),
                preAuth.getProcessedAt(),
                preAuth.getRequestedBy(),
                preAuth.getCreatedAt()
        );
    }
}
