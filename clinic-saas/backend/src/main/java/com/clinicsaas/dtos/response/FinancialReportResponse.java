package com.clinicsaas.dtos.response;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public record FinancialReportResponse(
        BigDecimal totalRevenue,
        BigDecimal totalPaid,
        BigDecimal totalOutstanding,
        long totalInvoices,
        Map<String, BigDecimal> revenueByMonth,
        Map<String, Long> invoicesByStatus,
        Map<String, Long> paymentsByMethod
) {}
