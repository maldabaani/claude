package com.clinicsaas.entities.tenant;

import com.clinicsaas.entities.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "radiology_studies")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class RadiologyStudy extends BaseEntity {

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "radiology_order_id", nullable = false)
    private RadiologyOrder radiologyOrder;

    @Column(name = "accession_number", unique = true, length = 50)
    private String accessionNumber;

    @Column(name = "study_instance_uid", unique = true, length = 100)
    private String studyInstanceUid;

    @Column(name = "performed_by")
    private UUID performedBy;

    @Column(name = "number_of_images")
    private Integer numberOfImages;

    @Column(name = "image_storage_path", length = 500)
    private String imageStoragePath;

    @Column(name = "performed_at")
    private LocalDateTime performedAt;

    @Column(columnDefinition = "TEXT")
    private String notes;
}
