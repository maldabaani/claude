package com.helpdesk.domain.attachment.service;

import com.helpdesk.domain.attachment.entity.Attachment;
import com.helpdesk.domain.attachment.repository.AttachmentRepository;
import com.helpdesk.domain.user.entity.User;
import com.helpdesk.shared.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AttachmentService {

    private final AttachmentRepository attachmentRepository;

    @Value("${app.upload.path}")
    private String uploadPath;

    @Transactional
    public Attachment upload(UUID ticketId, MultipartFile file, User uploader) {
        try {
            Path uploadDir = Paths.get(uploadPath).toAbsolutePath().normalize();
            Files.createDirectories(uploadDir);

            String storedName = UUID.randomUUID() + "_" + file.getOriginalFilename();
            Path targetPath = uploadDir.resolve(storedName);
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

            Attachment attachment = Attachment.builder()
                    .ticketId(ticketId)
                    .fileName(file.getOriginalFilename())
                    .fileSize(file.getSize())
                    .mimeType(file.getContentType())
                    .storagePath(storedName)
                    .uploadedById(uploader.getId())
                    .build();

            return attachmentRepository.save(attachment);
        } catch (IOException e) {
            throw new RuntimeException("Failed to store file", e);
        }
    }

    public Resource download(UUID id) {
        Attachment attachment = attachmentRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new ResourceNotFoundException("Attachment", id));
        try {
            Path filePath = Paths.get(uploadPath).resolve(attachment.getStoragePath()).normalize();
            Resource resource = new UrlResource(filePath.toUri());
            if (!resource.exists()) throw new ResourceNotFoundException("File not found on disk");
            return resource;
        } catch (MalformedURLException e) {
            throw new RuntimeException("File path error", e);
        }
    }

    public List<Attachment> findByTicket(UUID ticketId) {
        return attachmentRepository.findByTicketIdAndDeletedAtIsNull(ticketId);
    }
}
