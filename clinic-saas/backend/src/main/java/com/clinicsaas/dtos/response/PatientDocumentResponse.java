package com.clinicsaas.dtos.response;

import com.clinicsaas.entities.tenant.PatientDocument;

import java.time.LocalDateTime;
import java.util.UUID;

public record PatientDocumentResponse(
        UUID id,
        UUID patientId,
        UUID visitId,
        String documentType,
        String fileName,
        String fileContentType,
        Long fileSize,
        String storagePath,
        String description,
        UUID uploadedBy,
        String downloadUrl,
        LocalDateTime createdAt
) {
    public static PatientDocumentResponse from(PatientDocument doc) {
        return new PatientDocumentResponse(
                doc.getId(),
                doc.getPatientId(),
                doc.getVisitId(),
                doc.getDocumentType(),
                doc.getFileName(),
                doc.getFileContentType(),
                doc.getFileSize(),
                doc.getStoragePath(),
                doc.getDescription(),
                doc.getUploadedBy(),
                "/api/v1/documents/" + doc.getId() + "/download",
                doc.getCreatedAt()
        );
    }
}
