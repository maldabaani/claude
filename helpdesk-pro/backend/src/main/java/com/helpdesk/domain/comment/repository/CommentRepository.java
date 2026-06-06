package com.helpdesk.domain.comment.repository;

import com.helpdesk.domain.comment.entity.Comment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CommentRepository extends JpaRepository<Comment, UUID> {

    @Query("SELECT c FROM Comment c WHERE c.ticketId = :ticketId AND c.deletedAt IS NULL AND (:includeInternal = true OR c.internal = false) ORDER BY c.createdAt ASC")
    List<Comment> findByTicketId(UUID ticketId, boolean includeInternal);

    Optional<Comment> findByIdAndDeletedAtIsNull(UUID id);
}
