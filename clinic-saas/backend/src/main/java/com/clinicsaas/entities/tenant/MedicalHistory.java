package com.clinicsaas.entities.tenant;

import com.clinicsaas.entities.BaseEntity;
import com.clinicsaas.entities.enums.MedicalHistoryStatus;
import com.clinicsaas.entities.enums.MedicalHistoryType;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "medical_history")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class MedicalHistory extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @Enumerated(EnumType.STRING)
    @Column(name = "history_type", nullable = false, length = 30)
    private MedicalHistoryType historyType;

    @Column(name = "condition_name", nullable = false, length = 300)
    private String conditionName;

    @Column(name = "icd_code", length = 20)
    private String icdCode;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    @Builder.Default
    private MedicalHistoryStatus status = MedicalHistoryStatus.ACTIVE;

    @Column(name = "onset_date")
    private LocalDate onsetDate;

    @Column(name = "resolved_date")
    private LocalDate resolvedDate;

    @Column(name = "treating_physician", length = 200)
    private String treatingPhysician;

    @Column(columnDefinition = "TEXT")
    private String notes;
}
