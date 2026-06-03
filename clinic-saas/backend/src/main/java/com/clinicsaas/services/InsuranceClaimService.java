package com.clinicsaas.services;

import com.clinicsaas.dtos.request.ProcessClaimRequest;
import com.clinicsaas.dtos.response.InsuranceClaimResponse;
import com.clinicsaas.entities.enums.InsuranceClaimStatus;
import com.clinicsaas.entities.enums.InvoiceStatus;
import com.clinicsaas.entities.enums.PaymentMethod;
import com.clinicsaas.entities.tenant.InsuranceClaim;
import com.clinicsaas.entities.tenant.Invoice;
import com.clinicsaas.entities.tenant.InsurancePolicy;
import com.clinicsaas.entities.tenant.Payment;
import com.clinicsaas.exceptions.BadRequestException;
import com.clinicsaas.exceptions.ResourceNotFoundException;
import com.clinicsaas.repositories.tenant.InsuranceClaimRepository;
import com.clinicsaas.repositories.tenant.InsurancePolicyRepository;
import com.clinicsaas.repositories.tenant.InvoiceRepository;
import com.clinicsaas.repositories.tenant.PaymentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class InsuranceClaimService {

    private final InsuranceClaimRepository insuranceClaimRepository;
    private final InvoiceRepository invoiceRepository;
    private final InsurancePolicyRepository insurancePolicyRepository;
    private final PaymentRepository paymentRepository;

    @Transactional("tenantTransactionManager")
    public InsuranceClaimResponse createForInvoice(UUID invoiceId, UUID insurancePolicyId) {
        log.debug("Creating insurance claim for invoice {} with policy {}", invoiceId, insurancePolicyId);
        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice", invoiceId));
        InsurancePolicy policy = insurancePolicyRepository.findById(insurancePolicyId)
                .orElseThrow(() -> new ResourceNotFoundException("InsurancePolicy", insurancePolicyId));

        String claimNumber = "CLM-" + System.currentTimeMillis();
        BigDecimal claimedAmount = invoice.getInsuranceLiabilityAmount() != null
                ? invoice.getInsuranceLiabilityAmount()
                : BigDecimal.ZERO;

        InsuranceClaim claim = InsuranceClaim.builder()
                .invoice(invoice)
                .insurancePolicy(policy)
                .claimNumber(claimNumber)
                .status(InsuranceClaimStatus.DRAFT)
                .claimedAmount(claimedAmount)
                .build();

        InsuranceClaim saved = insuranceClaimRepository.save(claim);
        log.debug("Created insurance claim {} for invoice {}", claimNumber, invoice.getInvoiceNumber());
        return InsuranceClaimResponse.from(saved);
    }

    @Transactional(value = "tenantTransactionManager", readOnly = true)
    public InsuranceClaimResponse getById(UUID id) {
        log.debug("Fetching insurance claim {}", id);
        InsuranceClaim claim = insuranceClaimRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("InsuranceClaim", id));
        return InsuranceClaimResponse.from(claim);
    }

    @Transactional(value = "tenantTransactionManager", readOnly = true)
    public List<InsuranceClaimResponse> listAll(String statusFilter) {
        log.debug("Listing insurance claims, statusFilter={}", statusFilter);
        List<InsuranceClaim> claims;
        if (!StringUtils.hasText(statusFilter)) {
            claims = insuranceClaimRepository.findAllByOrderByCreatedAtDesc();
        } else {
            InsuranceClaimStatus status;
            try {
                status = InsuranceClaimStatus.valueOf(statusFilter.toUpperCase());
            } catch (IllegalArgumentException e) {
                throw new BadRequestException("Invalid claim status: " + statusFilter);
            }
            claims = insuranceClaimRepository.findByStatusOrderByCreatedAtDesc(status);
        }
        return claims.stream().map(InsuranceClaimResponse::from).collect(Collectors.toList());
    }

    @Transactional(value = "tenantTransactionManager", readOnly = true)
    public Optional<InsuranceClaimResponse> listByInvoice(UUID invoiceId) {
        log.debug("Looking up claim for invoice {}", invoiceId);
        return insuranceClaimRepository.findByInvoice_Id(invoiceId)
                .map(InsuranceClaimResponse::from);
    }

    @Transactional("tenantTransactionManager")
    public InsuranceClaimResponse submit(UUID claimId) {
        log.debug("Submitting insurance claim {}", claimId);
        InsuranceClaim claim = insuranceClaimRepository.findById(claimId)
                .orElseThrow(() -> new ResourceNotFoundException("InsuranceClaim", claimId));

        if (claim.getStatus() != InsuranceClaimStatus.DRAFT
                && claim.getStatus() != InsuranceClaimStatus.APPEALED) {
            throw new BadRequestException(
                    "Claim can only be submitted from DRAFT or APPEALED status. Current: " + claim.getStatus());
        }

        claim.setStatus(InsuranceClaimStatus.SUBMITTED);
        claim.setSubmittedAt(LocalDateTime.now());
        InsuranceClaim saved = insuranceClaimRepository.save(claim);
        log.debug("Submitted claim {}", claim.getClaimNumber());
        return InsuranceClaimResponse.from(saved);
    }

    @Transactional("tenantTransactionManager")
    public InsuranceClaimResponse processResult(UUID claimId, ProcessClaimRequest req) {
        log.debug("Processing result for claim {}, new status={}", claimId, req.status());
        InsuranceClaim claim = insuranceClaimRepository.findById(claimId)
                .orElseThrow(() -> new ResourceNotFoundException("InsuranceClaim", claimId));

        if (claim.getStatus() != InsuranceClaimStatus.SUBMITTED
                && claim.getStatus() != InsuranceClaimStatus.UNDER_REVIEW) {
            throw new BadRequestException(
                    "Claim can only be processed from SUBMITTED or UNDER_REVIEW status. Current: " + claim.getStatus());
        }

        claim.setStatus(req.status());
        claim.setApprovedAmount(req.approvedAmount());
        claim.setRejectedAmount(req.rejectedAmount());
        claim.setProcessedAt(LocalDateTime.now());
        claim.setRejectionReason(req.rejectionReason());
        if (req.notes() != null) {
            claim.setNotes(req.notes());
        }

        if (req.status() == InsuranceClaimStatus.APPROVED
                || req.status() == InsuranceClaimStatus.PARTIALLY_APPROVED) {
            BigDecimal approvedAmount = req.approvedAmount() != null ? req.approvedAmount() : BigDecimal.ZERO;
            if (approvedAmount.compareTo(BigDecimal.ZERO) > 0) {
                Invoice invoice = claim.getInvoice();
                String paymentNumber = "INS-PAY-" + System.currentTimeMillis();

                Payment payment = Payment.builder()
                        .invoice(invoice)
                        .patientId(invoice.getPatientId())
                        .paymentNumber(paymentNumber)
                        .amount(approvedAmount)
                        .paymentMethod(PaymentMethod.INSURANCE)
                        .paidAt(LocalDateTime.now())
                        .notes("Auto-created from insurance claim " + claim.getClaimNumber())
                        .build();

                paymentRepository.save(payment);

                BigDecimal newPaidAmount = invoice.getPaidAmount().add(approvedAmount);
                invoice.setPaidAmount(newPaidAmount);

                if (newPaidAmount.compareTo(invoice.getTotalAmount()) >= 0) {
                    invoice.setStatus(InvoiceStatus.PAID);
                    invoice.setPaidAt(LocalDateTime.now());
                } else {
                    invoice.setStatus(InvoiceStatus.PARTIALLY_PAID);
                }
                invoiceRepository.save(invoice);
                log.debug("Auto-created insurance payment {} for claim {}", paymentNumber, claim.getClaimNumber());
            }
        }

        InsuranceClaim saved = insuranceClaimRepository.save(claim);
        log.debug("Processed claim {} with status {}", claim.getClaimNumber(), req.status());
        return InsuranceClaimResponse.from(saved);
    }

    @Transactional("tenantTransactionManager")
    public InsuranceClaimResponse resubmit(UUID claimId, String notes) {
        log.debug("Resubmitting (appeal) claim {}", claimId);
        InsuranceClaim claim = insuranceClaimRepository.findById(claimId)
                .orElseThrow(() -> new ResourceNotFoundException("InsuranceClaim", claimId));

        if (claim.getStatus() != InsuranceClaimStatus.REJECTED) {
            throw new BadRequestException(
                    "Claim can only be resubmitted from REJECTED status. Current: " + claim.getStatus());
        }

        claim.setStatus(InsuranceClaimStatus.APPEALED);
        claim.setProcessedAt(null);
        if (StringUtils.hasText(notes)) {
            claim.setNotes(notes);
        }
        InsuranceClaim saved = insuranceClaimRepository.save(claim);
        log.debug("Appealed claim {}", claim.getClaimNumber());
        return InsuranceClaimResponse.from(saved);
    }
}
