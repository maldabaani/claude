package com.clinicsaas.dtos.response;

import com.clinicsaas.entities.enums.AllergenType;
import com.clinicsaas.entities.enums.AllergySeverity;
import com.clinicsaas.entities.tenant.Allergy;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

public record AllergyResponse(
        UUID id,
        UUID patientId,
        AllergenType allergenType,
        String allergenName,
        String reaction,
        AllergySeverity severity,
        LocalDate onsetDate,
        String notes,
        boolean active,
        LocalDateTime createdAt
) {
    public static AllergyResponse from(Allergy a) {
        return new AllergyResponse(
                a.getId(),
                a.getPatient().getId(),
                a.getAllergenType(),
                a.getAllergenName(),
                a.getReaction(),
                a.getSeverity(),
                a.getOnsetDate(),
                a.getNotes(),
                a.isActive(),
                a.getCreatedAt()
        );
    }
}
