package com.helpdesk.domain.ticket.service;

import com.helpdesk.domain.comment.entity.Comment;
import com.helpdesk.domain.comment.repository.CommentRepository;
import com.helpdesk.domain.notification.service.NotificationService;
import com.helpdesk.domain.ticket.entity.Ticket;
import com.helpdesk.domain.ticket.entity.TicketStatus;
import com.helpdesk.domain.user.entity.User;
import com.helpdesk.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

/**
 * Single-purpose AI agent that auto-resolves password-reset / account-access
 * tickets: generates a temporary password, emails it to the requester, posts
 * a summary comment, and closes the ticket. Anything outside that narrow
 * intent is left untouched for a human agent.
 */
@Service
@RequiredArgsConstructor
public class AccountAccessAgentService {

    private static final Logger log = LoggerFactory.getLogger(AccountAccessAgentService.class);

    private static final UUID AI_AGENT_USER_ID = UUID.fromString("a0000000-0000-0000-0000-00000000a1ae");

    private static final List<String> PASSWORD_RESET_KEYWORDS = List.of(
            "password", "reset", "locked out", "can't log in", "cannot log in",
            "can't login", "cannot login", "forgot password", "login issue", "unable to login"
    );

    private static final String TEMP_PASSWORD_CHARS =
            "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#%";

    private final TicketService ticketService;
    private final UserRepository userRepository;
    private final CommentRepository commentRepository;
    private final NotificationService notificationService;
    private final PasswordEncoder passwordEncoder;
    private final SecureRandom secureRandom = new SecureRandom();

    @Async("aiAgentExecutor")
    @Transactional
    public void process(UUID ticketId) {
        try {
            Ticket ticket = ticketService.getTicket(ticketId);
            if (ticket.isClosedByAi() || ticket.getStatus() == TicketStatus.CLOSED) {
                return;
            }
            if (!"account".equalsIgnoreCase(ticket.getCategory())) {
                return;
            }
            if (!looksLikePasswordResetRequest(ticket)) {
                log.info("AI agent skipping ticket {} - not a recognized password-reset intent", ticket.getTicketNumber());
                return;
            }

            User requester = userRepository.findById(ticket.getCreatedById()).orElse(null);
            if (requester == null) {
                log.warn("AI agent could not resolve requester for ticket {}", ticket.getTicketNumber());
                return;
            }

            String temporaryPassword = generateTemporaryPassword();
            requester.setPasswordHash(passwordEncoder.encode(temporaryPassword));
            userRepository.save(requester);

            // Email sending is paused until mail server details are configured.
            // TODO: switch back to notificationService.sendPasswordResetEmail(requester, temporaryPassword);
            log.info("AI agent password reset for ticket {} - would email {} with temporary password: {}",
                    ticket.getTicketNumber(), requester.getEmail(), temporaryPassword);

            Comment comment = Comment.builder()
                    .ticketId(ticketId)
                    .authorId(AI_AGENT_USER_ID)
                    .body("AI Agent: a temporary password has been generated for " + requester.getEmail() +
                            ". Email delivery is currently paused pending mail server setup - please share the credential with the customer manually for now.")
                    .internal(false)
                    .build();
            commentRepository.save(comment);

            ticketService.closeByAi(ticketId);
            log.info("AI agent auto-resolved password reset for ticket {}", ticket.getTicketNumber());
        } catch (Exception e) {
            log.warn("AI agent failed to process ticket {}: {}", ticketId, e.getMessage());
        }
    }

    private boolean looksLikePasswordResetRequest(Ticket ticket) {
        String text = ((ticket.getTitle() != null ? ticket.getTitle() : "") + " " +
                (ticket.getDescription() != null ? ticket.getDescription() : "")).toLowerCase(Locale.ROOT);
        return PASSWORD_RESET_KEYWORDS.stream().anyMatch(text::contains);
    }

    private String generateTemporaryPassword() {
        StringBuilder sb = new StringBuilder(14);
        for (int i = 0; i < 14; i++) {
            sb.append(TEMP_PASSWORD_CHARS.charAt(secureRandom.nextInt(TEMP_PASSWORD_CHARS.length())));
        }
        return sb.toString();
    }
}
