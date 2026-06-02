package com.clinicsaas.services;

import com.clinicsaas.dtos.request.CreatePrescriptionRequest;
import com.clinicsaas.dtos.request.PrescriptionItemRequest;
import com.clinicsaas.dtos.response.PrescriptionItemResponse;
import com.clinicsaas.dtos.response.PrescriptionResponse;
import com.clinicsaas.entities.tenant.Medication;
import com.clinicsaas.entities.tenant.Prescription;
import com.clinicsaas.entities.tenant.PrescriptionItem;
import com.clinicsaas.entities.tenant.Visit;
import com.clinicsaas.exceptions.ResourceNotFoundException;
import com.clinicsaas.repositories.tenant.MedicationRepository;
import com.clinicsaas.repositories.tenant.PrescriptionItemRepository;
import com.clinicsaas.repositories.tenant.PrescriptionRepository;
import com.clinicsaas.repositories.tenant.VisitRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class PrescriptionService {

    private final PrescriptionRepository prescriptionRepository;
    private final PrescriptionItemRepository prescriptionItemRepository;
    private final VisitRepository visitRepository;
    private final MedicationRepository medicationRepository;

    @Transactional("tenantTransactionManager")
    public PrescriptionResponse create(CreatePrescriptionRequest req, UUID prescribedBy) {
        Visit visit = visitRepository.findById(req.visitId())
                .orElseThrow(() -> new ResourceNotFoundException("Visit", req.visitId()));

        String prescriptionNumber = "RX-" + System.currentTimeMillis();

        Prescription prescription = Prescription.builder()
                .visit(visit)
                .patientId(visit.getPatient().getId())
                .prescribedBy(prescribedBy)
                .prescriptionNumber(prescriptionNumber)
                .validUntil(req.validUntil())
                .notes(req.notes())
                .build();

        Prescription saved = prescriptionRepository.save(prescription);

        List<PrescriptionItem> items = req.items().stream()
                .map(itemReq -> buildItem(itemReq, saved))
                .collect(Collectors.toList());

        List<PrescriptionItem> savedItems = prescriptionItemRepository.saveAll(items);
        List<PrescriptionItemResponse> itemResponses = savedItems.stream()
                .map(PrescriptionItemResponse::from)
                .collect(Collectors.toList());

        log.debug("Created prescription {} with {} items", prescriptionNumber, items.size());
        return PrescriptionResponse.from(saved, itemResponses);
    }

    @Transactional(value = "tenantTransactionManager", readOnly = true)
    public PrescriptionResponse getById(UUID id) {
        Prescription prescription = prescriptionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Prescription", id));
        List<PrescriptionItemResponse> items = prescriptionItemRepository.findByPrescription_Id(id).stream()
                .map(PrescriptionItemResponse::from)
                .collect(Collectors.toList());
        return PrescriptionResponse.from(prescription, items);
    }

    @Transactional(value = "tenantTransactionManager", readOnly = true)
    public List<PrescriptionResponse> listByPatient(UUID patientId) {
        return prescriptionRepository.findByPatientIdOrderByCreatedAtDesc(patientId).stream()
                .map(p -> {
                    List<PrescriptionItemResponse> items = prescriptionItemRepository
                            .findByPrescription_Id(p.getId()).stream()
                            .map(PrescriptionItemResponse::from)
                            .collect(Collectors.toList());
                    return PrescriptionResponse.from(p, items);
                })
                .collect(Collectors.toList());
    }

    @Transactional(value = "tenantTransactionManager", readOnly = true)
    public List<PrescriptionResponse> listAll(String status) {
        List<Prescription> prescriptions = prescriptionRepository.findAllByOrderByCreatedAtDesc();
        if (status != null && !status.isBlank()) {
            prescriptions = prescriptions.stream()
                .filter(p -> p.getStatus() != null && p.getStatus().name().equals(status))
                .toList();
        }
        return prescriptions.stream().map(p -> {
            List<PrescriptionItemResponse> items = prescriptionItemRepository
                    .findByPrescription_Id(p.getId()).stream()
                    .map(PrescriptionItemResponse::from)
                    .collect(Collectors.toList());
            return PrescriptionResponse.from(p, items);
        }).toList();
    }

    private PrescriptionItem buildItem(PrescriptionItemRequest req, Prescription prescription) {
        Medication medication = null;
        if (req.medicationId() != null) {
            medication = medicationRepository.findById(req.medicationId()).orElse(null);
        }

        return PrescriptionItem.builder()
                .prescription(prescription)
                .medication(medication)
                .medicationNameSnapshot(req.medicationName())
                .dosage(req.dosage())
                .frequency(req.frequency())
                .route(req.route() != null ? req.route() : com.clinicsaas.entities.enums.MedicationRoute.ORAL)
                .durationDays(req.durationDays())
                .quantity(req.quantity())
                .instructions(req.instructions())
                .build();
    }
}
