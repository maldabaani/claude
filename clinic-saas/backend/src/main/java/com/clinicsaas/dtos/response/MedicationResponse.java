package com.clinicsaas.dtos.response;

import com.clinicsaas.entities.enums.MedicationForm;
import com.clinicsaas.entities.tenant.Medication;

import java.util.UUID;

public record MedicationResponse(
        UUID id,
        String genericName,
        String brandName,
        String drugClass,
        MedicationForm form,
        String strength
) {
    public static MedicationResponse from(Medication m) {
        return new MedicationResponse(
                m.getId(),
                m.getGenericName(),
                m.getBrandName(),
                m.getDrugClass(),
                m.getForm(),
                m.getStrength()
        );
    }
}
