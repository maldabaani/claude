package com.clinicsaas.services;

import com.clinicsaas.dtos.response.FinancialReportResponse;
import com.clinicsaas.entities.tenant.Invoice;
import com.clinicsaas.entities.tenant.Payment;
import com.clinicsaas.repositories.tenant.InvoiceRepository;
import com.clinicsaas.repositories.tenant.PaymentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final InvoiceRepository invoiceRepository;
    private final PaymentRepository paymentRepository;

    @Transactional(value = "tenantTransactionManager", readOnly = true)
    public FinancialReportResponse getFinancialReport() {
        List<Invoice> all = invoiceRepository.findAllOrderByCreatedAtDesc();

        BigDecimal totalRevenue     = BigDecimal.ZERO;
        BigDecimal totalPaid        = BigDecimal.ZERO;
        BigDecimal totalOutstanding = BigDecimal.ZERO;
        Map<String, BigDecimal> byMonth  = new LinkedHashMap<>();
        Map<String, Long>       byStatus = new LinkedHashMap<>();

        DateTimeFormatter monthFmt = DateTimeFormatter.ofPattern("yyyy-MM");

        for (Invoice inv : all) {
            totalRevenue = totalRevenue.add(inv.getTotalAmount());
            totalPaid    = totalPaid.add(inv.getPaidAmount());
            BigDecimal bal = inv.getTotalAmount().subtract(inv.getPaidAmount());
            if (bal.compareTo(BigDecimal.ZERO) > 0) totalOutstanding = totalOutstanding.add(bal);

            String month = inv.getCreatedAt().format(monthFmt);
            byMonth.merge(month, inv.getTotalAmount(), BigDecimal::add);

            byStatus.merge(inv.getStatus().name(), 1L, Long::sum);
        }

        // payment method breakdown from payments table
        Map<String, Long> byMethod = new LinkedHashMap<>();
        paymentRepository.findAll().forEach(p -> {
            String method = p.getPaymentMethod().name().replace("_", " ");
            byMethod.merge(method, 1L, Long::sum);
        });

        Map<String, BigDecimal> last12 = byMonth.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue,
                        (a, b) -> a, LinkedHashMap::new));

        return new FinancialReportResponse(
                totalRevenue, totalPaid, totalOutstanding,
                all.size(), last12, byStatus, byMethod
        );
    }
}
