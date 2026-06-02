package com.clinicsaas.dtos.response;

import com.clinicsaas.entities.enums.MedicalHistoryStatus;
import com.clinicsaas.entities.enums.MedicalHistoryType;
import com.clinicsaas.entities.tenant.MedicalHistory;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

public record MedicalHistoryResponse(
        UUID id,
        UUID patientId,
        MedicalHistoryType historyType,
        String conditionName,
        String icdCode,
        MedicalHistoryStatus status,
        LocalDate onsetDate,
        LocalDate resolvedDate,
        String treatingPhysician,
        String notes,
        LocalDateTime createdAt
) {
    public static MedicalHistoryResponse from(MedicalHistory mh) {
        return new MedicalHistoryResponse(
                mh.getId(),
                mh.getPatient().getId(),
                mh.getHistoryType(),
                mh.getConditionName(),
                mh.getIcdCode(),
                mh.getStatus(),
                mh.getOnsetDate(),
                mh.getResolvedDate(),
                mh.getTreatingPhysician(),
                mh.getNotes(),
                mh.getCreatedAt()
        );
    }
}
