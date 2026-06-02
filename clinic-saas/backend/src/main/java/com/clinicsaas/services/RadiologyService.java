package com.clinicsaas.services;

import com.clinicsaas.dtos.request.AddRadiologyReportRequest;
import com.clinicsaas.dtos.request.CreateRadiologyOrderRequest;
import com.clinicsaas.dtos.response.RadiologyOrderResponse;
import com.clinicsaas.dtos.response.RadiologyReportResponse;
import com.clinicsaas.entities.enums.LabOrderPriority;
import com.clinicsaas.entities.enums.RadiologyOrderStatus;
import com.clinicsaas.entities.enums.RadiologyReportStatus;
import com.clinicsaas.entities.tenant.RadiologyOrder;
import com.clinicsaas.entities.tenant.RadiologyReport;
import com.clinicsaas.entities.tenant.RadiologyStudy;
import com.clinicsaas.entities.tenant.Visit;
import com.clinicsaas.exceptions.ResourceNotFoundException;
import com.clinicsaas.repositories.tenant.RadiologyOrderRepository;
import com.clinicsaas.repositories.tenant.RadiologyReportRepository;
import com.clinicsaas.repositories.tenant.RadiologyStudyRepository;
import com.clinicsaas.repositories.tenant.VisitRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class RadiologyService {

    private final RadiologyOrderRepository radiologyOrderRepository;
    private final RadiologyStudyRepository radiologyStudyRepository;
    private final RadiologyReportRepository radiologyReportRepository;
    private final VisitRepository visitRepository;

    @Transactional("tenantTransactionManager")
    public RadiologyOrderResponse createOrder(CreateRadiologyOrderRequest req, UUID orderedBy) {
        Visit visit = visitRepository.findById(req.visitId())
                .orElseThrow(() -> new ResourceNotFoundException("Visit", req.visitId()));

        String orderNumber = "RAD-" + System.currentTimeMillis();
        LabOrderPriority priority = req.priority() != null ? req.priority() : LabOrderPriority.ROUTINE;

        RadiologyOrder order = RadiologyOrder.builder()
                .visit(visit)
                .patientId(visit.getPatient().getId())
                .orderedBy(orderedBy)
                .orderNumber(orderNumber)
                .modality(req.modality())
                .bodyPart(req.bodyPart())
                .laterality(req.laterality())
                .clinicalIndication(req.clinicalIndication())
                .priority(priority)
                .status(RadiologyOrderStatus.ORDERED)
                .build();

        RadiologyOrder saved = radiologyOrderRepository.save(order);
        log.debug("Created radiology order {} modality={}", orderNumber, req.modality());
        return RadiologyOrderResponse.from(saved, null);
    }

    @Transactional(value = "tenantTransactionManager", readOnly = true)
    public RadiologyOrderResponse getById(UUID id) {
        RadiologyOrder order = radiologyOrderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("RadiologyOrder", id));
        return buildResponse(order);
    }

    @Transactional(value = "tenantTransactionManager", readOnly = true)
    public List<RadiologyOrderResponse> listByVisit(UUID visitId) {
        return radiologyOrderRepository.findByVisit_IdOrderByCreatedAtDesc(visitId).stream()
                .map(this::buildResponse)
                .collect(Collectors.toList());
    }

    @Transactional(value = "tenantTransactionManager", readOnly = true)
    public List<RadiologyOrderResponse> listByPatient(UUID patientId) {
        return radiologyOrderRepository.findByPatientIdOrderByCreatedAtDesc(patientId).stream()
                .map(this::buildResponse)
                .collect(Collectors.toList());
    }

    @Transactional("tenantTransactionManager")
    public RadiologyOrderResponse addReport(UUID orderId, AddRadiologyReportRequest req, UUID reportedBy) {
        RadiologyOrder order = radiologyOrderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("RadiologyOrder", orderId));

        // Auto-create study if none exists
        RadiologyStudy study = radiologyStudyRepository.findByRadiologyOrder_Id(orderId)
                .orElseGet(() -> {
                    RadiologyStudy newStudy = RadiologyStudy.builder()
                            .radiologyOrder(order)
                            .performedAt(LocalDateTime.now())
                            .build();
                    return radiologyStudyRepository.save(newStudy);
                });

        // Update order status
        order.setStatus(RadiologyOrderStatus.COMPLETED);
        if (order.getPerformedAt() == null) {
            order.setPerformedAt(LocalDateTime.now());
        }
        radiologyOrderRepository.save(order);

        RadiologyReportStatus reportStatus = req.status() != null ? req.status() : RadiologyReportStatus.DRAFT;

        // Create or update report
        Optional<RadiologyReport> existingReport = radiologyReportRepository.findByRadiologyStudy_Id(study.getId());
        RadiologyReport report;
        if (existingReport.isPresent()) {
            report = existingReport.get();
            report.setFindings(req.findings());
            report.setImpression(req.impression());
            report.setRecommendation(req.recommendation());
            report.setStatus(reportStatus);
            report.setAmendedAt(LocalDateTime.now());
        } else {
            report = RadiologyReport.builder()
                    .radiologyStudy(study)
                    .reportedBy(reportedBy)
                    .findings(req.findings())
                    .impression(req.impression())
                    .recommendation(req.recommendation())
                    .status(reportStatus)
                    .reportedAt(LocalDateTime.now())
                    .build();
        }
        RadiologyReport savedReport = radiologyReportRepository.save(report);

        log.debug("Report added/updated for radiology order id={}", orderId);
        return RadiologyOrderResponse.from(order, RadiologyReportResponse.from(savedReport));
    }

    private RadiologyOrderResponse buildResponse(RadiologyOrder order) {
        RadiologyReportResponse reportResponse = radiologyStudyRepository
                .findByRadiologyOrder_Id(order.getId())
                .flatMap(study -> radiologyReportRepository.findByRadiologyStudy_Id(study.getId()))
                .map(RadiologyReportResponse::from)
                .orElse(null);
        return RadiologyOrderResponse.from(order, reportResponse);
    }
}
