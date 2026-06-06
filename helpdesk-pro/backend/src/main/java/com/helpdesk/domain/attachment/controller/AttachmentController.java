package com.helpdesk.domain.attachment.controller;

import com.helpdesk.domain.attachment.entity.Attachment;
import com.helpdesk.domain.attachment.service.AttachmentService;
import com.helpdesk.domain.user.entity.User;
import com.helpdesk.shared.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class AttachmentController {

    private final AttachmentService attachmentService;

    @PostMapping("/api/v1/tickets/{ticketId}/attachments")
    public ResponseEntity<ApiResponse<Attachment>> upload(
            @PathVariable UUID ticketId,
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(ApiResponse.ok("File uploaded", attachmentService.upload(ticketId, file, currentUser)));
    }

    @GetMapping("/api/v1/tickets/{ticketId}/attachments")
    public ResponseEntity<ApiResponse<List<Attachment>>> findByTicket(@PathVariable UUID ticketId) {
        return ResponseEntity.ok(ApiResponse.ok(attachmentService.findByTicket(ticketId)));
    }

    @GetMapping("/api/v1/attachments/{id}/download")
    public ResponseEntity<Resource> download(@PathVariable UUID id) {
        Resource resource = attachmentService.download(id);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + resource.getFilename() + "\"")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(resource);
    }
}
