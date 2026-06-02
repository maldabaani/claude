package com.clinicsaas.entities.tenant;

import com.clinicsaas.entities.BaseEntity;
import com.clinicsaas.entities.enums.PrescriptionStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "prescriptions")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Prescription extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "visit_id", nullable = false)
    private Visit visit;

    @Column(name = "patient_id", nullable = false)
    private UUID patientId;

    @Column(name = "prescribed_by", nullable = false)
    private UUID prescribedBy;

    @Column(name = "prescription_number", nullable = false, unique = true, length = 30)
    private String prescriptionNumber;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private PrescriptionStatus status = PrescriptionStatus.ACTIVE;

    @Column(name = "valid_until")
    private LocalDate validUntil;

    @Column(name = "dispensed_at")
    private java.time.LocalDateTime dispensedAt;

    @Column(columnDefinition = "TEXT")
    private String notes;
}
