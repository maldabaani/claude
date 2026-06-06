package com.helpdesk.domain.notification.service;

import com.helpdesk.domain.comment.entity.Comment;
import com.helpdesk.domain.notification.entity.Notification;
import com.helpdesk.domain.notification.entity.NotificationType;
import com.helpdesk.domain.notification.repository.NotificationRepository;
import com.helpdesk.domain.ticket.entity.Ticket;
import com.helpdesk.domain.user.entity.User;
import com.helpdesk.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public void notifyTicketCreated(Ticket ticket) {
        String msg = "New ticket created: " + ticket.getTicketNumber();
        createAndSend(ticket.getCreatedById(), "TICKET_CREATED", ticket.getId(), msg);
    }

    public void notifyTicketAssigned(Ticket ticket) {
        if (ticket.getAssignedAgentId() == null) return;
        String msg = "Ticket " + ticket.getTicketNumber() + " has been assigned to you";
        createAndSend(ticket.getAssignedAgentId(), "TICKET_ASSIGNED", ticket.getId(), msg);
    }

    public void notifyStatusChanged(Ticket ticket) {
        String msg = "Ticket " + ticket.getTicketNumber() + " status changed to " + ticket.getStatus();
        createAndSend(ticket.getCreatedById(), "STATUS_CHANGED", ticket.getId(), msg);
    }

    public void notifyCommentAdded(Ticket ticket, Comment comment) {
        String msg = "New " + (comment.isInternal() ? "note" : "reply") + " on ticket " + ticket.getTicketNumber();
        if (!comment.getAuthorId().equals(ticket.getCreatedById())) {
            createAndSend(ticket.getCreatedById(), "COMMENT_ADDED", ticket.getId(), msg);
        }
        if (ticket.getAssignedAgentId() != null && !comment.getAuthorId().equals(ticket.getAssignedAgentId())) {
            createAndSend(ticket.getAssignedAgentId(), "COMMENT_ADDED", ticket.getId(), msg);
        }
    }

    public void notifySlaBreached(Ticket ticket) {
        String msg = "SLA breached for ticket " + ticket.getTicketNumber();
        if (ticket.getAssignedAgentId() != null) {
            createAndSend(ticket.getAssignedAgentId(), "SLA_BREACHED", ticket.getId(), msg);
        }
        userRepository.findAllActiveAgents().stream()
                .filter(u -> "TEAM_LEAD".equals(u.getRole().name()) || "ADMIN".equals(u.getRole().name()))
                .forEach(u -> createAndSend(u.getId(), "SLA_BREACHED", ticket.getId(), msg));
    }

    public Page<Notification> getNotifications(UUID recipientId, Pageable pageable) {
        return notificationRepository.findByRecipientIdAndDeletedAtIsNullOrderByCreatedAtDesc(recipientId, pageable);
    }

    public long getUnreadCount(UUID recipientId) {
        return notificationRepository.countByRecipientIdAndReadFalseAndDeletedAtIsNull(recipientId);
    }

    @Transactional
    public void markAllRead(UUID recipientId) {
        notificationRepository.markAllReadByRecipient(recipientId);
    }

    private void createAndSend(UUID recipientId, String event, UUID referenceId, String message) {
        try {
            Notification notification = Notification.builder()
                    .recipientId(recipientId)
                    .type(NotificationType.IN_APP)
                    .event(event)
                    .referenceId(referenceId)
                    .message(message)
                    .build();
            notificationRepository.save(notification);
            messagingTemplate.convertAndSendToUser(recipientId.toString(), "/queue/notifications", notification);
        } catch (Exception e) {
            log.error("Failed to send notification to {}: {}", recipientId, e.getMessage());
        }
    }
}
