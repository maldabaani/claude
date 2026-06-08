package com.clinicsaas.dtos.response;

import com.clinicsaas.entities.enums.PreAuthorizationStatus;
import com.clinicsaas.entities.tenant.PreAuthorization;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

public record PreAuthorizationResponse(
        UUID id,
        UUID patientId,
        UUID insurancePolicyId,
        String policyNumber,
        String payerName,
        UUID visitId,
        String preauthNumber,
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
    public static PreAuthorizationResponse from(PreAuthorization pa) {
        var policy = pa.getInsurancePolicy();
        return new PreAuthorizationResponse(
                pa.getId(),
                pa.getPatientId(),
                policy != null ? policy.getId() : null,
                policy != null ? policy.getPolicyNumber() : null,
                policy != null && policy.getPayer() != null ? policy.getPayer().getName() : null,
                pa.getVisitId(),
                pa.getPreauthNumber(),
                pa.getServiceDescription(),
                pa.getIcdCode(),
                pa.getEstimatedAmount(),
                pa.getStatus(),
                pa.getApprovalNumber(),
                pa.getValidUntil(),
                pa.getRejectionReason(),
                pa.getNotes(),
                pa.getSubmittedAt(),
                pa.getProcessedAt(),
                pa.getRequestedBy(),
                pa.getCreatedAt()
        );
    }
}
