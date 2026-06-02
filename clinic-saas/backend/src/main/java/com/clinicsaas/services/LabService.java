package com.clinicsaas.services;

import com.clinicsaas.dtos.request.AddLabResultRequest;
import com.clinicsaas.dtos.request.CreateLabOrderRequest;
import com.clinicsaas.dtos.response.LabOrderItemResponse;
import com.clinicsaas.dtos.response.LabOrderResponse;
import com.clinicsaas.dtos.response.LabTestResponse;
import com.clinicsaas.entities.enums.LabOrderPriority;
import com.clinicsaas.entities.enums.LabOrderStatus;
import com.clinicsaas.entities.tenant.LabOrder;
import com.clinicsaas.entities.tenant.LabOrderItem;
import com.clinicsaas.entities.tenant.LabTest;
import com.clinicsaas.entities.tenant.Visit;
import com.clinicsaas.exceptions.ResourceNotFoundException;
import com.clinicsaas.repositories.tenant.LabOrderItemRepository;
import com.clinicsaas.repositories.tenant.LabOrderRepository;
import com.clinicsaas.repositories.tenant.LabTestRepository;
import com.clinicsaas.repositories.tenant.VisitRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class LabService {

    private final LabOrderRepository labOrderRepository;
    private final LabOrderItemRepository labOrderItemRepository;
    private final LabTestRepository labTestRepository;
    private final VisitRepository visitRepository;

    @Transactional("tenantTransactionManager")
    public LabOrderResponse createOrder(CreateLabOrderRequest req, UUID orderedBy) {
        Visit visit = visitRepository.findById(req.visitId())
                .orElseThrow(() -> new ResourceNotFoundException("Visit", req.visitId()));

        String orderNumber = "LAB-" + System.currentTimeMillis();
        LabOrderPriority priority = req.priority() != null ? req.priority() : LabOrderPriority.ROUTINE;

        LabOrder order = LabOrder.builder()
                .visit(visit)
                .patientId(visit.getPatient().getId())
                .orderedBy(orderedBy)
                .orderNumber(orderNumber)
                .priority(priority)
                .clinicalIndication(req.clinicalIndication())
                .build();

        LabOrder savedOrder = labOrderRepository.save(order);

        List<LabOrderItem> items = req.labTestIds().stream()
                .map(testId -> {
                    LabTest labTest = labTestRepository.findById(testId)
                            .orElseThrow(() -> new ResourceNotFoundException("LabTest", testId));
                    return LabOrderItem.builder()
                            .labOrder(savedOrder)
                            .labTest(labTest)
                            .normalRangeSnapshot(buildNormalRangeSnapshot(labTest))
                            .build();
                })
                .collect(Collectors.toList());

        List<LabOrderItem> savedItems = labOrderItemRepository.saveAll(items);
        List<LabOrderItemResponse> itemResponses = savedItems.stream()
                .map(LabOrderItemResponse::from)
                .collect(Collectors.toList());

        log.debug("Created lab order {} with {} items", orderNumber, items.size());
        return LabOrderResponse.from(savedOrder, itemResponses);
    }

    @Transactional("tenantTransactionManager")
    public void addResult(UUID itemId, AddLabResultRequest req, UUID resultedBy) {
        LabOrderItem item = labOrderItemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("LabOrderItem", itemId));

        item.setResultValue(req.resultValue());
        item.setResultText(req.resultText());
        item.setResultUnit(req.unit());
        item.setAbnormal(req.abnormal());
        item.setCritical(req.critical());
        item.setNotes(req.notes());
        item.setResultedAt(LocalDateTime.now());
        item.setResultedBy(resultedBy);
        item.setStatus(LabOrderStatus.RESULTED);
        labOrderItemRepository.save(item);

        // Check if all items resulted, update order status
        LabOrder order = item.getLabOrder();
        List<LabOrderItem> allItems = labOrderItemRepository.findByLabOrder_Id(order.getId());
        boolean allResulted = allItems.stream()
                .allMatch(i -> i.getStatus() == LabOrderStatus.RESULTED);
        boolean anyResulted = allItems.stream()
                .anyMatch(i -> i.getStatus() == LabOrderStatus.RESULTED);

        if (allResulted) {
            order.setStatus(LabOrderStatus.RESULTED);
            order.setResultedAt(LocalDateTime.now());
        } else if (anyResulted) {
            order.setStatus(LabOrderStatus.PARTIALLY_RESULTED);
        }
        labOrderRepository.save(order);
    }

    @Transactional(value = "tenantTransactionManager", readOnly = true)
    public List<LabOrderResponse> listByVisit(UUID visitId) {
        return labOrderRepository.findByVisit_IdOrderByCreatedAtDesc(visitId).stream()
                .map(order -> {
                    List<LabOrderItemResponse> items = labOrderItemRepository
                            .findByLabOrder_Id(order.getId()).stream()
                            .map(LabOrderItemResponse::from)
                            .collect(Collectors.toList());
                    return LabOrderResponse.from(order, items);
                })
                .collect(Collectors.toList());
    }

    @Transactional(value = "tenantTransactionManager", readOnly = true)
    public LabOrderResponse getById(UUID id) {
        LabOrder order = labOrderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("LabOrder", id));
        List<LabOrderItemResponse> items = labOrderItemRepository.findByLabOrder_Id(id).stream()
                .map(LabOrderItemResponse::from)
                .collect(Collectors.toList());
        return LabOrderResponse.from(order, items);
    }

    @Transactional(value = "tenantTransactionManager", readOnly = true)
    public List<LabTestResponse> listActiveTests() {
        return labTestRepository.findAll().stream()
                .filter(LabTest::isActive)
                .map(LabTestResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional(value = "tenantTransactionManager", readOnly = true)
    public List<LabOrderResponse> listAll(String status) {
        List<LabOrder> orders = labOrderRepository.findAllByOrderByCreatedAtDesc();
        if (status != null && !status.isBlank()) {
            orders = orders.stream()
                .filter(o -> o.getStatus() != null && o.getStatus().name().equals(status))
                .toList();
        }
        return orders.stream().map(order -> {
            List<LabOrderItemResponse> items = labOrderItemRepository
                    .findByLabOrder_Id(order.getId()).stream()
                    .map(LabOrderItemResponse::from)
                    .collect(Collectors.toList());
            return LabOrderResponse.from(order, items);
        }).toList();
    }

    private String buildNormalRangeSnapshot(LabTest labTest) {
        if (labTest.getNormalRangeText() != null) {
            return labTest.getNormalRangeText();
        }
        if (labTest.getNormalRangeMin() != null && labTest.getNormalRangeMax() != null) {
            return labTest.getNormalRangeMin() + " - " + labTest.getNormalRangeMax()
                    + (labTest.getUnit() != null ? " " + labTest.getUnit() : "");
        }
        return null;
    }
}
