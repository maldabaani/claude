package com.helpdesk.domain.attachment.repository;

import com.helpdesk.domain.attachment.entity.Attachment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AttachmentRepository extends JpaRepository<Attachment, UUID> {
    List<Attachment> findByTicketIdAndDeletedAtIsNull(UUID ticketId);
    List<Attachment> findByCommentIdAndDeletedAtIsNull(UUID commentId);
    Optional<Attachment> findByIdAndDeletedAtIsNull(UUID id);
}
