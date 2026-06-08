package com.helpdesk.domain.comment.service;

import com.helpdesk.domain.comment.dto.CommentResponse;
import com.helpdesk.domain.comment.dto.CreateCommentRequest;
import com.helpdesk.domain.comment.entity.Comment;
import com.helpdesk.domain.comment.repository.CommentRepository;
import com.helpdesk.domain.notification.service.NotificationService;
import com.helpdesk.domain.webhook.WebhookService;
import com.helpdesk.domain.ticket.entity.Ticket;
import com.helpdesk.domain.ticket.entity.TicketStatus;
import com.helpdesk.domain.ticket.repository.TicketRepository;
import com.helpdesk.domain.ticket.service.TicketService;
import com.helpdesk.domain.user.entity.Role;
import com.helpdesk.domain.user.entity.User;
import com.helpdesk.domain.user.repository.UserRepository;
import com.helpdesk.domain.user.service.UserService;
import com.helpdesk.shared.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CommentService {

    private final CommentRepository commentRepository;
    private final TicketRepository ticketRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final UserService userService;
    private final WebhookService webhookService;

    @Transactional
    public CommentResponse create(UUID ticketId, CreateCommentRequest request, User author) {
        Ticket ticket = ticketRepository.findByIdAndDeletedAtIsNull(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket", ticketId));

        boolean isInternal = request.internal() && author.getRole() != Role.CUSTOMER;

        if (ticket.getFirstResponseAt() == null && author.getRole() != Role.CUSTOMER) {
            ticket.setFirstResponseAt(Instant.now());
        }
        if (ticket.getStatus() == TicketStatus.CLOSED && author.getRole() == Role.CUSTOMER) {
            ticket.setStatus(TicketStatus.OPEN);
            ticket.setResolvedAt(null);
            ticket.setClosedAt(null);
        }
        ticketRepository.save(ticket);

        Comment comment = Comment.builder()
                .ticketId(ticketId)
                .authorId(author.getId())
                .body(request.body())
                .internal(isInternal)
                .build();

        Comment saved = commentRepository.save(comment);
        notificationService.notifyCommentAdded(ticket, saved);
        webhookService.fireEvent("comment.added", toResponse(saved));
        return toResponse(saved);
    }

    public List<CommentResponse> findByTicket(UUID ticketId, User currentUser) {
        boolean includeInternal = currentUser.getRole() != Role.CUSTOMER;
        return commentRepository.findByTicketId(ticketId, includeInternal)
                .stream().map(this::toResponse).toList();
    }

    @Transactional
    public CommentResponse update(UUID ticketId, UUID commentId, String body) {
        Comment comment = commentRepository.findByIdAndDeletedAtIsNull(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Comment", commentId));
        comment.setBody(body);
        return toResponse(commentRepository.save(comment));
    }

    @Transactional
    public void delete(UUID ticketId, UUID commentId) {
        Comment comment = commentRepository.findByIdAndDeletedAtIsNull(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Comment", commentId));
        comment.softDelete();
        commentRepository.save(comment);
    }

    private CommentResponse toResponse(Comment comment) {
        return new CommentResponse(
                comment.getId(), comment.getTicketId(),
                userRepository.findById(comment.getAuthorId()).map(userService::toResponse).orElse(null),
                comment.getBody(), comment.isInternal(), comment.getCreatedAt(), comment.getUpdatedAt()
        );
    }
}
