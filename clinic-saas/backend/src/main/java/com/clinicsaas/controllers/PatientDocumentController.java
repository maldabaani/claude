package com.clinicsaas.controllers;

import com.clinicsaas.dtos.response.PatientDocumentResponse;
import com.clinicsaas.security.AppUserPrincipal;
import com.clinicsaas.services.PatientDocumentService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/documents")
@RequiredArgsConstructor
@Tag(name = "Patient Documents")
@SecurityRequirement(name = "bearerAuth")
public class PatientDocumentController {

    private final PatientDocumentService patientDocumentService;

    @PostMapping(value = "/patient/{patientId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAuthority('PATIENT_WRITE')")
    public ResponseEntity<PatientDocumentResponse> upload(
            @PathVariable UUID patientId,
            @RequestParam(required = false) UUID visitId,
            @RequestParam(defaultValue = "OTHER") String documentType,
            @RequestParam(required = false) String description,
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal AppUserPrincipal principal) {
        return ResponseEntity.status(201).body(
                patientDocumentService.upload(patientId, visitId, documentType, description, file, principal.getId()));
    }

    @GetMapping("/patient/{patientId}")
    @PreAuthorize("hasAuthority('PATIENT_READ')")
    public ResponseEntity<List<PatientDocumentResponse>> listByPatient(@PathVariable UUID patientId) {
        return ResponseEntity.ok(patientDocumentService.listByPatient(patientId));
    }

    @GetMapping("/{id}/download")
    @PreAuthorize("hasAuthority('PATIENT_READ')")
    public ResponseEntity<byte[]> download(@PathVariable UUID id) {
        byte[] data = patientDocumentService.download(id);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"document\"")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(data);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('PATIENT_WRITE')")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        patientDocumentService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
