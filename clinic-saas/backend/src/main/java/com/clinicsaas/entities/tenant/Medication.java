package com.clinicsaas.entities.tenant;

import com.clinicsaas.entities.BaseEntity;
import com.clinicsaas.entities.enums.MedicationForm;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "medications")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Medication extends BaseEntity {

    @Column(name = "generic_name", nullable = false, length = 200)
    private String genericName;

    @Column(name = "brand_name", length = 200)
    private String brandName;

    @Column(name = "drug_class", length = 100)
    private String drugClass;

    @Column(name = "atc_code", length = 20)
    private String atcCode;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private MedicationForm form;

    @Column(length = 50)
    private String strength;

    @Column(length = 20)
    private String manufacturer;

    @Column(name = "is_controlled")
    @Builder.Default
    private boolean controlled = false;

    @Column(name = "requires_prescription")
    @Builder.Default
    private boolean requiresPrescription = true;

    @Builder.Default
    @Column(nullable = false)
    private boolean active = true;
}
