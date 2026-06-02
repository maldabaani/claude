package com.clinicsaas.entities.tenant;

import com.clinicsaas.entities.BaseEntity;
import com.clinicsaas.entities.enums.AllergenType;
import com.clinicsaas.entities.enums.AllergySeverity;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "allergies")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Allergy extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @Enumerated(EnumType.STRING)
    @Column(name = "allergen_type", nullable = false, length = 20)
    private AllergenType allergenType;

    @Column(name = "allergen_name", nullable = false, length = 200)
    private String allergenName;

    @Column(name = "reaction", length = 500)
    private String reaction;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private AllergySeverity severity;

    @Column(name = "onset_date")
    private LocalDate onsetDate;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Builder.Default
    @Column(nullable = false)
    private boolean active = true;
}
