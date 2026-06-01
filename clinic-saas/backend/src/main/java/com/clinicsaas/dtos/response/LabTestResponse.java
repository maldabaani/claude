package com.clinicsaas.dtos.response;

import com.clinicsaas.entities.tenant.LabTest;

import java.math.BigDecimal;
import java.util.UUID;

public record LabTestResponse(
        UUID id,
        String code,
        String name,
        String category,
        String unit,
        BigDecimal normalRangeMin,
        BigDecimal normalRangeMax,
        String normalRangeText
) {
    public static LabTestResponse from(LabTest t) {
        return new LabTestResponse(
                t.getId(),
                t.getCode(),
                t.getName(),
                t.getCategory(),
                t.getUnit(),
                t.getNormalRangeMin(),
                t.getNormalRangeMax(),
                t.getNormalRangeText()
        );
    }
}
