package com.clinicsaas.services;

import com.clinicsaas.dtos.request.AddPaymentRequest;
import com.clinicsaas.dtos.request.CreateInvoiceRequest;
import com.clinicsaas.dtos.request.InvoiceItemRequest;
import com.clinicsaas.dtos.response.InvoiceItemResponse;
import com.clinicsaas.dtos.response.InvoiceResponse;
import com.clinicsaas.dtos.response.PaymentResponse;
import com.clinicsaas.entities.enums.InvoiceStatus;
import com.clinicsaas.entities.tenant.Invoice;
import com.clinicsaas.entities.tenant.InvoiceItem;
import com.clinicsaas.entities.tenant.Payment;
import com.clinicsaas.exceptions.ResourceNotFoundException;
import com.clinicsaas.repositories.tenant.InvoiceItemRepository;
import com.clinicsaas.repositories.tenant.InvoiceRepository;
import com.clinicsaas.repositories.tenant.PaymentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class InvoiceService {

    private final InvoiceRepository invoiceRepository;
    private final InvoiceItemRepository invoiceItemRepository;
    private final PaymentRepository paymentRepository;

    @Transactional("tenantTransactionManager")
    public InvoiceResponse create(CreateInvoiceRequest req) {
        String invoiceNumber = "INV-" + System.currentTimeMillis();

        BigDecimal subtotal = req.items().stream()
                .map(item -> {
                    BigDecimal lineTotal = item.quantity().multiply(item.unitPrice());
                    BigDecimal discount = item.discountAmount() != null ? item.discountAmount() : BigDecimal.ZERO;
                    return lineTotal.subtract(discount);
                })
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Invoice invoice = Invoice.builder()
                .patientId(req.patientId())
                .visitId(req.visitId())
                .invoiceNumber(invoiceNumber)
                .status(InvoiceStatus.ISSUED)
                .subtotal(subtotal)
                .totalAmount(subtotal)
                .dueDate(req.dueDate())
                .issuedAt(LocalDateTime.now())
                .notes(req.notes())
                .build();

        Invoice savedInvoice = invoiceRepository.save(invoice);

        List<InvoiceItem> items = req.items().stream()
                .map(itemReq -> buildInvoiceItem(itemReq, savedInvoice))
                .collect(Collectors.toList());

        List<InvoiceItem> savedItems = invoiceItemRepository.saveAll(items);
        List<InvoiceItemResponse> itemResponses = savedItems.stream()
                .map(InvoiceItemResponse::from)
                .collect(Collectors.toList());

        log.debug("Created invoice {} for patient {}", invoiceNumber, req.patientId());
        return InvoiceResponse.from(savedInvoice, itemResponses, List.of());
    }

    @Transactional(value = "tenantTransactionManager", readOnly = true)
    public InvoiceResponse getById(UUID id) {
        Invoice invoice = invoiceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice", id));
        return toResponse(invoice);
    }

    @Transactional(value = "tenantTransactionManager", readOnly = true)
    public Page<InvoiceResponse> listByPatient(UUID patientId, Pageable pageable) {
        return invoiceRepository.findByPatientIdOrderByCreatedAtDesc(patientId, pageable)
                .map(this::toResponse);
    }

    @Transactional("tenantTransactionManager")
    public InvoiceResponse addPayment(UUID invoiceId, AddPaymentRequest req, UUID processedBy) {
        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice", invoiceId));

        String paymentNumber = "PAY-" + System.currentTimeMillis();

        Payment payment = Payment.builder()
                .invoice(invoice)
                .patientId(invoice.getPatientId())
                .paymentNumber(paymentNumber)
                .amount(req.amount())
                .paymentMethod(req.paymentMethod())
                .transactionReference(req.transactionReference())
                .paidAt(LocalDateTime.now())
                .processedBy(processedBy)
                .notes(req.notes())
                .build();

        paymentRepository.save(payment);

        BigDecimal newPaidAmount = invoice.getPaidAmount().add(req.amount());
        invoice.setPaidAmount(newPaidAmount);

        if (newPaidAmount.compareTo(invoice.getTotalAmount()) >= 0) {
            invoice.setStatus(InvoiceStatus.PAID);
            invoice.setPaidAt(LocalDateTime.now());
        } else {
            invoice.setStatus(InvoiceStatus.PARTIALLY_PAID);
        }

        Invoice updatedInvoice = invoiceRepository.save(invoice);
        log.debug("Payment {} added to invoice {}", paymentNumber, invoice.getInvoiceNumber());
        return toResponse(updatedInvoice);
    }

    private InvoiceResponse toResponse(Invoice invoice) {
        List<InvoiceItemResponse> items = invoiceItemRepository.findByInvoice_Id(invoice.getId()).stream()
                .map(InvoiceItemResponse::from)
                .collect(Collectors.toList());
        List<PaymentResponse> payments = paymentRepository.findByInvoice_Id(invoice.getId()).stream()
                .map(PaymentResponse::from)
                .collect(Collectors.toList());
        return InvoiceResponse.from(invoice, items, payments);
    }

    private InvoiceItem buildInvoiceItem(InvoiceItemRequest req, Invoice invoice) {
        BigDecimal discount = req.discountAmount() != null ? req.discountAmount() : BigDecimal.ZERO;
        BigDecimal totalPrice = req.quantity().multiply(req.unitPrice()).subtract(discount);

        return InvoiceItem.builder()
                .invoice(invoice)
                .serviceType(req.serviceType())
                .description(req.description())
                .referenceId(req.referenceId())
                .quantity(req.quantity())
                .unitPrice(req.unitPrice())
                .discountAmount(discount)
                .totalPrice(totalPrice)
                .build();
    }
}
