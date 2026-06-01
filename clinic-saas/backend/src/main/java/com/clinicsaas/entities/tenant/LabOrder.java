package com.clinicsaas.entities.tenant;

import com.clinicsaas.entities.BaseEntity;
import com.clinicsaas.entities.enums.LabOrderPriority;
import com.clinicsaas.entities.enums.LabOrderStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "lab_orders")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class LabOrder extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "visit_id", nullable = false)
    private Visit visit;

    @Column(name = "patient_id", nullable = false)
    private UUID patientId;

    @Column(name = "ordered_by", nullable = false)
    private UUID orderedBy;

    @Column(name = "order_number", nullable = false, unique = true, length = 30)
    private String orderNumber;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private LabOrderStatus status = LabOrderStatus.ORDERED;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 15)
    @Builder.Default
    private LabOrderPriority priority = LabOrderPriority.ROUTINE;

    @Column(name = "clinical_indication", columnDefinition = "TEXT")
    private String clinicalIndication;

    @Column(name = "sample_collected_at")
    private LocalDateTime sampleCollectedAt;

    @Column(name = "resulted_at")
    private LocalDateTime resultedAt;

    @Column(columnDefinition = "TEXT")
    private String notes;
}
