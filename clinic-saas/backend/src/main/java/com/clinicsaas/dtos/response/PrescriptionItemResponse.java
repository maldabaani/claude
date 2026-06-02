package com.clinicsaas.dtos.response;

import com.clinicsaas.entities.enums.DosageFrequency;
import com.clinicsaas.entities.enums.MedicationRoute;
import com.clinicsaas.entities.tenant.PrescriptionItem;

import java.util.UUID;

public record PrescriptionItemResponse(
        UUID id,
        UUID medicationId,
        String medicationNameSnapshot,
        String dosage,
        DosageFrequency frequency,
        MedicationRoute route,
        Integer durationDays,
        Integer quantity,
        String instructions
) {
    public static PrescriptionItemResponse from(PrescriptionItem item) {
        return new PrescriptionItemResponse(
                item.getId(),
                item.getMedication() != null ? item.getMedication().getId() : null,
                item.getMedicationNameSnapshot(),
                item.getDosage(),
                item.getFrequency(),
                item.getRoute(),
                item.getDurationDays(),
                item.getQuantity(),
                item.getInstructions()
        );
    }
}
