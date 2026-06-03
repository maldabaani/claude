package com.clinicsaas.dtos.response;

import com.clinicsaas.entities.enums.InsuranceClaimStatus;
import com.clinicsaas.entities.tenant.InsuranceClaim;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public record InsuranceClaimResponse(
        UUID id,
        String claimNumber,
        UUID invoiceId,
        String invoiceNumber,
        UUID patientId,
        UUID insurancePolicyId,
        String payerName,
        String policyNumber,
        InsuranceClaimStatus status,
        BigDecimal claimedAmount,
        BigDecimal approvedAmount,
        BigDecimal rejectedAmount,
        LocalDateTime submittedAt,
        LocalDateTime processedAt,
        String rejectionReason,
        String notes,
        LocalDateTime createdAt
) {
    public static InsuranceClaimResponse from(InsuranceClaim claim) {
        var invoice = claim.getInvoice();
        var policy = claim.getInsurancePolicy();
        return new InsuranceClaimResponse(
                claim.getId(),
                claim.getClaimNumber(),
                invoice != null ? invoice.getId() : null,
                invoice != null ? invoice.getInvoiceNumber() : null,
                invoice != null ? invoice.getPatientId() : null,
                policy != null ? policy.getId() : null,
                policy != null && policy.getPayer() != null ? policy.getPayer().getName() : null,
                policy != null ? policy.getPolicyNumber() : null,
                claim.getStatus(),
                claim.getClaimedAmount(),
                claim.getApprovedAmount(),
                claim.getRejectedAmount(),
                claim.getSubmittedAt(),
                claim.getProcessedAt(),
                claim.getRejectionReason(),
                claim.getNotes(),
                claim.getCreatedAt()
        );
    }
}
