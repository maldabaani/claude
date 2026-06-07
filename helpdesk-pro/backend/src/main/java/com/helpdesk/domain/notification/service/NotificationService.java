package com.helpdesk.domain.notification.service;

import com.helpdesk.domain.comment.entity.Comment;
import com.helpdesk.domain.notification.entity.Notification;
import com.helpdesk.domain.notification.entity.NotificationType;
import com.helpdesk.domain.notification.repository.NotificationRepository;
import com.helpdesk.domain.ticket.entity.Ticket;
import com.helpdesk.domain.user.entity.User;
import com.helpdesk.domain.user.repository.UserRepository;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final JavaMailSender mailSender;

    public void notifyTicketCreated(Ticket ticket) {
        String msg = "New ticket created: " + ticket.getTicketNumber();
        createAndSend(ticket.getCreatedById(), "TICKET_CREATED", ticket.getId(), msg);
        // Email customer
        userRepository.findById(ticket.getCreatedById()).ifPresent(customer -> {
            String subject = "Ticket #" + ticket.getTicketNumber() + " received";
            String body = buildEmail("Ticket Received",
                "Hi " + customer.getFullName() + ",",
                "Your support ticket has been received and our team will be in touch shortly.",
                "Ticket: <strong>" + ticket.getTitle() + "</strong><br>Reference: " + ticket.getTicketNumber());
            sendEmail(customer.getEmail(), subject, body);
        });
    }

    public void notifyTicketAssigned(Ticket ticket) {
        if (ticket.getAssignedAgentId() == null) return;
        String msg = "Ticket " + ticket.getTicketNumber() + " has been assigned to you";
        createAndSend(ticket.getAssignedAgentId(), "TICKET_ASSIGNED", ticket.getId(), msg);
        // Email agent
        userRepository.findById(ticket.getAssignedAgentId()).ifPresent(agent -> {
            String subject = "Ticket assigned: #" + ticket.getTicketNumber();
            String body = buildEmail("Ticket Assigned",
                "Hi " + agent.getFullName() + ",",
                "A ticket has been assigned to you.",
                "Ticket: <strong>" + ticket.getTitle() + "</strong><br>Reference: " + ticket.getTicketNumber());
            sendEmail(agent.getEmail(), subject, body);
        });
    }

    public void notifyStatusChanged(Ticket ticket) {
        String msg = "Ticket " + ticket.getTicketNumber() + " status changed to " + ticket.getStatus();
        createAndSend(ticket.getCreatedById(), "STATUS_CHANGED", ticket.getId(), msg);
        // Email customer when resolved or closed
        String status = ticket.getStatus().name();
        if ("RESOLVED".equals(status) || "CLOSED".equals(status)) {
            userRepository.findById(ticket.getCreatedById()).ifPresent(customer -> {
                String subject = "Your ticket #" + ticket.getTicketNumber() + " has been " + status.toLowerCase();
                String body = buildEmail("Ticket " + capitalize(status),
                    "Hi " + customer.getFullName() + ",",
                    "Your support ticket has been " + status.toLowerCase() + ".",
                    "Ticket: <strong>" + ticket.getTitle() + "</strong><br>Reference: " + ticket.getTicketNumber());
                sendEmail(customer.getEmail(), subject, body);
            });
        }
    }

    public void notifyCommentAdded(Ticket ticket, Comment comment) {
        String msg = "New " + (comment.isInternal() ? "note" : "reply") + " on ticket " + ticket.getTicketNumber();
        if (!comment.getAuthorId().equals(ticket.getCreatedById())) {
            createAndSend(ticket.getCreatedById(), "COMMENT_ADDED", ticket.getId(), msg);
            // Email customer for public replies
            if (!comment.isInternal()) {
                userRepository.findById(ticket.getCreatedById()).ifPresent(customer ->
                    userRepository.findById(comment.getAuthorId()).ifPresent(author -> {
                        String subject = "New reply on ticket #" + ticket.getTicketNumber();
                        String body = buildEmail("New Reply",
                            "Hi " + customer.getFullName() + ",",
                            author.getFullName() + " has replied to your ticket.",
                            "Ticket: <strong>" + ticket.getTitle() + "</strong><br>Message: " + comment.getBody());
                        sendEmail(customer.getEmail(), subject, body);
                    })
                );
            }
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

    private void sendEmail(String to, String subject, String htmlBody) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setFrom("noreply@helpdesk.com");
            helper.setText(htmlBody, true);
            mailSender.send(message);
        } catch (MessagingException e) {
            log.warn("Failed to send email to {}: {}", to, e.getMessage());
        }
    }

    private String buildEmail(String heading, String greeting, String intro, String details) {
        return "<html><body style='font-family:sans-serif;color:#333;max-width:600px;margin:0 auto'>" +
            "<div style='background:#2563EB;padding:20px;text-align:center'>" +
            "<h2 style='color:white;margin:0'>HelpDesk Pro</h2></div>" +
            "<div style='padding:24px;background:#fff;border:1px solid #e2e8f0'>" +
            "<h3 style='color:#1e293b'>" + heading + "</h3>" +
            "<p>" + greeting + "</p>" +
            "<p>" + intro + "</p>" +
            "<div style='background:#f8fafc;border-left:4px solid #2563EB;padding:12px 16px;margin:16px 0'>" +
            details + "</div>" +
            "<p style='color:#64748b;font-size:12px;margin-top:24px'>This is an automated message from HelpDesk Pro.</p>" +
            "</div></body></html>";
    }

    private String capitalize(String s) {
        if (s == null || s.isEmpty()) return s;
        return s.substring(0, 1).toUpperCase() + s.substring(1).toLowerCase();
    }
}
