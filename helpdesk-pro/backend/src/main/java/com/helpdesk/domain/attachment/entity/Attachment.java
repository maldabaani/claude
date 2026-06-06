package com.helpdesk.domain.attachment.entity;

import com.helpdesk.shared.audit.AuditableEntity;
import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "attachments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Attachment extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "ticket_id")
    private UUID ticketId;

    @Column(name = "comment_id")
    private UUID commentId;

    @Column(name = "file_name", nullable = false)
    private String fileName;

    @Column(name = "file_size", nullable = false)
    private long fileSize;

    @Column(name = "mime_type", nullable = false)
    private String mimeType;

    @Column(name = "storage_path", nullable = false)
    private String storagePath;

    @Column(name = "uploaded_by_id", nullable = false)
    private UUID uploadedById;
}
