package com.clinicsaas.services;

import com.clinicsaas.dtos.response.PatientDocumentResponse;
import com.clinicsaas.entities.tenant.PatientDocument;
import com.clinicsaas.exceptions.ResourceNotFoundException;
import com.clinicsaas.multitenancy.TenantContext;
import com.clinicsaas.repositories.tenant.PatientDocumentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class PatientDocumentService {

    private final PatientDocumentRepository patientDocumentRepository;

    @Transactional("tenantTransactionManager")
    public PatientDocumentResponse upload(UUID patientId, UUID visitId, String documentType,
                                          String description, MultipartFile file, UUID uploadedBy) {
        log.debug("Uploading document for patient {}, type={}", patientId, documentType);
        String tenantId = TenantContext.getCurrentTenant();
        String fileId = UUID.randomUUID().toString();
        String originalFilename = file.getOriginalFilename() != null ? file.getOriginalFilename() : "file";
        String storagePath = System.getProperty("user.home") + "/clinic-uploads/"
                + tenantId + "/" + patientId + "/" + fileId + "_" + originalFilename;

        try {
            Path path = Paths.get(storagePath);
            Files.createDirectories(path.getParent());
            file.transferTo(path);
            log.debug("Stored file at {}", storagePath);
        } catch (IOException e) {
            throw new RuntimeException("Failed to store file: " + e.getMessage(), e);
        }

        PatientDocument doc = PatientDocument.builder()
                .patientId(patientId)
                .visitId(visitId)
                .documentType(documentType)
                .fileName(originalFilename)
                .fileContentType(file.getContentType())
                .fileSize(file.getSize())
                .storagePath(storagePath)
                .description(description)
                .uploadedBy(uploadedBy)
                .build();

        PatientDocument saved = patientDocumentRepository.save(doc);
        log.debug("Saved document record {} for patient {}", saved.getId(), patientId);
        return PatientDocumentResponse.from(saved);
    }

    @Transactional(value = "tenantTransactionManager", readOnly = true)
    public List<PatientDocumentResponse> listByPatient(UUID patientId) {
        log.debug("Listing documents for patient {}", patientId);
        return patientDocumentRepository.findByPatientIdOrderByCreatedAtDesc(patientId)
                .stream().map(PatientDocumentResponse::from).collect(Collectors.toList());
    }

    @Transactional(value = "tenantTransactionManager", readOnly = true)
    public byte[] download(UUID documentId) {
        log.debug("Downloading document {}", documentId);
        PatientDocument doc = patientDocumentRepository.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("PatientDocument", documentId));
        try {
            return Files.readAllBytes(Paths.get(doc.getStoragePath()));
        } catch (IOException e) {
            throw new RuntimeException("Failed to read file: " + e.getMessage(), e);
        }
    }

    @Transactional("tenantTransactionManager")
    public void delete(UUID documentId) {
        log.debug("Deleting document {}", documentId);
        PatientDocument doc = patientDocumentRepository.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("PatientDocument", documentId));
        try {
            Files.deleteIfExists(Paths.get(doc.getStoragePath()));
        } catch (IOException e) {
            log.debug("Could not delete file {}: {}", doc.getStoragePath(), e.getMessage());
        }
        patientDocumentRepository.delete(doc);
        log.debug("Deleted document {}", documentId);
    }
}
