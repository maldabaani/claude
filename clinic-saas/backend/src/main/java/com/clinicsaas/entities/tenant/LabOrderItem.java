package com.clinicsaas.entities.tenant;

import com.clinicsaas.entities.BaseEntity;
import com.clinicsaas.entities.enums.LabOrderStatus;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "lab_order_items")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class LabOrderItem extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lab_order_id", nullable = false)
    private LabOrder labOrder;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lab_test_id", nullable = false)
    private LabTest labTest;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private LabOrderStatus status = LabOrderStatus.ORDERED;

    @Column(name = "result_value", precision = 15, scale = 4)
    private BigDecimal resultValue;

    @Column(name = "result_text", columnDefinition = "TEXT")
    private String resultText;

    @Column(name = "result_unit", length = 50)
    private String resultUnit;

    @Column(name = "normal_range_snapshot", length = 200)
    private String normalRangeSnapshot;

    @Column(name = "is_abnormal")
    @Builder.Default
    private boolean abnormal = false;

    @Column(name = "is_critical")
    @Builder.Default
    private boolean critical = false;

    @Column(name = "resulted_at")
    private LocalDateTime resultedAt;

    @Column(name = "resulted_by")
    private UUID resultedBy;

    @Column(columnDefinition = "TEXT")
    private String notes;
}
