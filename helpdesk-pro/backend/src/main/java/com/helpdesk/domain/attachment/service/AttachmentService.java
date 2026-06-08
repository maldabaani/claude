package com.helpdesk.domain.attachment.service;

import com.helpdesk.domain.attachment.entity.Attachment;
import com.helpdesk.domain.attachment.repository.AttachmentRepository;
import com.helpdesk.domain.ticket.entity.Ticket;
import com.helpdesk.domain.ticket.repository.TicketRepository;
import com.helpdesk.domain.user.entity.Role;
import com.helpdesk.domain.user.entity.User;
import com.helpdesk.shared.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.security.access.AccessDeniedException;
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
import java.util.Set;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AttachmentService {

    private final AttachmentRepository attachmentRepository;
    private final TicketRepository ticketRepository;

    @Value("${app.upload.path}")
    private String uploadPath;

    private static final Set<String> ALLOWED_MIME_TYPES = Set.of(
        "application/pdf",
        "image/jpeg", "image/png", "image/gif", "image/webp",
        "text/plain", "text/csv",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/msword", "application/vnd.ms-excel"
    );
    private static final long MAX_FILE_SIZE = 20 * 1024 * 1024L; // 20MB
    private static final Set<String> BLOCKED_EXTENSIONS = Set.of(
        "exe", "sh", "bat", "cmd", "ps1", "msi", "dmg", "jar", "war"
    );

    @Transactional
    public Attachment upload(UUID ticketId, MultipartFile file, User uploader) {
        // Validate file size
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException("File size exceeds maximum allowed size of 20MB");
        }

        // Validate MIME type
        String mimeType = file.getContentType();
        if (mimeType == null || !ALLOWED_MIME_TYPES.contains(mimeType)) {
            throw new IllegalArgumentException("File type not allowed: " + mimeType);
        }

        // Validate extension
        String originalFilename = file.getOriginalFilename();
        if (originalFilename != null) {
            int dotIndex = originalFilename.lastIndexOf('.');
            if (dotIndex >= 0) {
                String ext = originalFilename.substring(dotIndex + 1).toLowerCase();
                if (BLOCKED_EXTENSIONS.contains(ext)) {
                    throw new IllegalArgumentException("File extension not allowed: " + ext);
                }
            }
        }

        try {
            Path uploadDir = Paths.get(uploadPath).toAbsolutePath().normalize();
            Files.createDirectories(uploadDir);

            String storedName = UUID.randomUUID() + "_" + originalFilename;
            Path targetPath = uploadDir.resolve(storedName);
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

            Attachment attachment = Attachment.builder()
                    .ticketId(ticketId)
                    .fileName(originalFilename)
                    .fileSize(file.getSize())
                    .mimeType(mimeType)
                    .storagePath(storedName)
                    .uploadedById(uploader.getId())
                    .build();

            return attachmentRepository.save(attachment);
        } catch (IOException e) {
            throw new RuntimeException("Failed to store file", e);
        }
    }

    public Resource download(UUID id, User currentUser) {
        Attachment attachment = attachmentRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new ResourceNotFoundException("Attachment", id));

        // Access control: customers can only download attachments from their own tickets
        if (currentUser.getRole() == Role.CUSTOMER) {
            Ticket ticket = ticketRepository.findByIdAndDeletedAtIsNull(attachment.getTicketId())
                    .orElseThrow(() -> new ResourceNotFoundException("Ticket", attachment.getTicketId()));
            if (!ticket.getCreatedById().equals(currentUser.getId())) {
                throw new AccessDeniedException("You are not allowed to download this attachment");
            }
        }

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
