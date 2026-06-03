package com.clinicsaas.entities.tenant;

import com.clinicsaas.entities.BaseEntity;
import com.clinicsaas.entities.enums.PreAuthorizationStatus;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "pre_authorizations")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PreAuthorization extends BaseEntity {

    @Column(name = "patient_id", nullable = false)
    private UUID patientId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "insurance_policy_id", nullable = false)
    private InsurancePolicy insurancePolicy;

    @Column(name = "visit_id")
    private UUID visitId;

    @Column(name = "preauth_number", unique = true, length = 50)
    private String preauthNumber;

    @Column(name = "service_description", nullable = false, length = 500)
    private String serviceDescription;

    @Column(name = "icd_code", length = 20)
    private String icdCode;

    @Column(name = "estimated_amount", precision = 12, scale = 2)
    private BigDecimal estimatedAmount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private PreAuthorizationStatus status = PreAuthorizationStatus.DRAFT;

    @Column(name = "approval_number", length = 100)
    private String approvalNumber;

    @Column(name = "valid_until")
    private LocalDate validUntil;

    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "submitted_at")
    private LocalDateTime submittedAt;

    @Column(name = "processed_at")
    private LocalDateTime processedAt;

    @Column(name = "requested_by")
    private UUID requestedBy;
}
