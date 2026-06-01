package com.clinicsaas.dtos.request;

import java.math.BigDecimal;

public record AddLabResultRequest(
        BigDecimal resultValue,
        String resultText,
        String unit,
        boolean abnormal,
        boolean critical,
        String notes
) {}
