package com.clinicsaas.dtos.response;

import com.clinicsaas.entities.enums.LabOrderStatus;
import com.clinicsaas.entities.tenant.LabOrderItem;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public record LabOrderItemResponse(
        UUID id,
        UUID labTestId,
        String labTestName,
        LabOrderStatus status,
        BigDecimal resultValue,
        String resultText,
        String resultUnit,
        String normalRangeSnapshot,
        boolean abnormal,
        boolean critical,
        LocalDateTime resultedAt
) {
    public static LabOrderItemResponse from(LabOrderItem item) {
        return new LabOrderItemResponse(
                item.getId(),
                item.getLabTest().getId(),
                item.getLabTest().getName(),
                item.getStatus(),
                item.getResultValue(),
                item.getResultText(),
                item.getResultUnit(),
                item.getNormalRangeSnapshot(),
                item.isAbnormal(),
                item.isCritical(),
                item.getResultedAt()
        );
    }
}
