package com.clinicsaas.entities.tenant;

import com.clinicsaas.entities.BaseEntity;
import com.clinicsaas.entities.enums.DosageFrequency;
import com.clinicsaas.entities.enums.MedicationRoute;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "prescription_items")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PrescriptionItem extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "prescription_id", nullable = false)
    private Prescription prescription;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "medication_id")
    private Medication medication;

    @Column(name = "medication_name_snapshot", nullable = false, length = 200)
    private String medicationNameSnapshot;

    @Column(nullable = false, length = 100)
    private String dosage;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private DosageFrequency frequency;

    @Column(name = "frequency_details", length = 200)
    private String frequencyDetails;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private MedicationRoute route = MedicationRoute.ORAL;

    @Column(name = "duration_days")
    private Integer durationDays;

    @Column
    private Integer quantity;

    @Column(name = "is_substitution_allowed")
    @Builder.Default
    private boolean substitutionAllowed = false;

    @Column(columnDefinition = "TEXT")
    private String instructions;
}
