package com.clinicsaas.entities.tenant;

import com.clinicsaas.entities.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "insurance_policies")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class InsurancePolicy extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @Column(name = "insurer_name", nullable = false, length = 200)
    private String insurerName;

    @Column(name = "policy_number", nullable = false, length = 100)
    private String policyNumber;

    @Column(name = "member_number", length = 100)
    private String memberNumber;

    @Column(name = "group_number", length = 100)
    private String groupNumber;

    @Column(name = "coverage_type", length = 100)
    private String coverageType;

    @Column(name = "valid_from")
    private LocalDate validFrom;

    @Column(name = "valid_to")
    private LocalDate validTo;

    @Column(name = "copay_amount", precision = 10, scale = 2)
    private BigDecimal copayAmount;

    @Column(name = "deductible_amount", precision = 10, scale = 2)
    private BigDecimal deductibleAmount;

    @Column(name = "coverage_percentage", precision = 5, scale = 2)
    private BigDecimal coveragePercentage;

    @Builder.Default
    @Column(nullable = false)
    private boolean active = true;
}
