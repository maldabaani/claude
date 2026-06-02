package com.clinicsaas.entities.tenant;

import com.clinicsaas.entities.BaseEntity;
import com.clinicsaas.entities.enums.DiagnosisType;
import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "diagnoses")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Diagnosis extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "visit_id", nullable = false)
    private Visit visit;

    @Column(name = "patient_id", nullable = false)
    private UUID patientId;

    @Column(name = "diagnosed_by", nullable = false)
    private UUID diagnosedBy;

    @Enumerated(EnumType.STRING)
    @Column(name = "diagnosis_type", nullable = false, length = 20)
    @Builder.Default
    private DiagnosisType diagnosisType = DiagnosisType.PRIMARY;

    @Column(name = "icd_code", length = 20)
    private String icdCode;

    @Column(name = "icd_description", length = 500)
    private String icdDescription;

    @Column(name = "clinical_description", columnDefinition = "TEXT")
    private String clinicalDescription;

    @Column(name = "is_chronic")
    @Builder.Default
    private boolean chronic = false;
}
