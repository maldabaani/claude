package com.clinicsaas.entities.tenant;

import com.clinicsaas.entities.BaseEntity;
import com.clinicsaas.entities.enums.RadiologyReportStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "radiology_reports")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class RadiologyReport extends BaseEntity {

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "radiology_study_id", nullable = false)
    private RadiologyStudy radiologyStudy;

    @Column(name = "reported_by", nullable = false)
    private UUID reportedBy;

    @Column(columnDefinition = "TEXT")
    private String findings;

    @Column(columnDefinition = "TEXT")
    private String impression;

    @Column(columnDefinition = "TEXT")
    private String recommendation;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private RadiologyReportStatus status = RadiologyReportStatus.DRAFT;

    @Column(name = "reported_at")
    private LocalDateTime reportedAt;

    @Column(name = "amended_at")
    private LocalDateTime amendedAt;

    @Column(name = "amendment_reason", columnDefinition = "TEXT")
    private String amendmentReason;
}
