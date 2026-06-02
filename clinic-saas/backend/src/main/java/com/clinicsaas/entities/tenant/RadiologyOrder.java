package com.clinicsaas.entities.tenant;

import com.clinicsaas.entities.BaseEntity;
import com.clinicsaas.entities.enums.ImagingModality;
import com.clinicsaas.entities.enums.LabOrderPriority;
import com.clinicsaas.entities.enums.RadiologyOrderStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "radiology_orders")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class RadiologyOrder extends BaseEntity {

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
    @Column(nullable = false, length = 25)
    private ImagingModality modality;

    @Column(name = "body_part", length = 100)
    private String bodyPart;

    @Column(name = "laterality", length = 10)
    private String laterality;

    @Column(name = "clinical_indication", columnDefinition = "TEXT")
    private String clinicalIndication;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private RadiologyOrderStatus status = RadiologyOrderStatus.ORDERED;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 15)
    @Builder.Default
    private LabOrderPriority priority = LabOrderPriority.ROUTINE;

    @Column(name = "scheduled_at")
    private LocalDateTime scheduledAt;

    @Column(name = "performed_at")
    private LocalDateTime performedAt;

    @Column(columnDefinition = "TEXT")
    private String notes;
}
