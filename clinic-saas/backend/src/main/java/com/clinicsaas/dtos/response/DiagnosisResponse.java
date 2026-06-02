package com.clinicsaas.dtos.response;

import com.clinicsaas.entities.enums.DiagnosisType;
import com.clinicsaas.entities.tenant.Diagnosis;

import java.time.LocalDateTime;
import java.util.UUID;

public record DiagnosisResponse(
        UUID id,
        UUID visitId,
        UUID patientId,
        UUID diagnosedBy,
        DiagnosisType diagnosisType,
        String icdCode,
        String icdDescription,
        String clinicalDescription,
        boolean chronic,
        LocalDateTime createdAt
) {
    public static DiagnosisResponse from(Diagnosis d) {
        return new DiagnosisResponse(
                d.getId(),
                d.getVisit().getId(),
                d.getPatientId(),
                d.getDiagnosedBy(),
                d.getDiagnosisType(),
                d.getIcdCode(),
                d.getIcdDescription(),
                d.getClinicalDescription(),
                d.isChronic(),
                d.getCreatedAt()
        );
    }
}
