package com.clinicsaas.entities.tenant;

import com.clinicsaas.entities.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "patient_documents")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PatientDocument extends BaseEntity {

    @Column(name = "patient_id", nullable = false)
    private UUID patientId;

    @Column(name = "visit_id")
    private UUID visitId;

    @Column(name = "document_type", nullable = false, length = 50)
    private String documentType;

    @Column(name = "file_name", nullable = false, length = 255)
    private String fileName;

    @Column(name = "file_content_type", length = 100)
    private String fileContentType;

    @Column(name = "file_size")
    private Long fileSize;

    @Column(name = "storage_path", nullable = false, columnDefinition = "TEXT")
    private String storagePath;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "uploaded_by")
    private UUID uploadedBy;
}
