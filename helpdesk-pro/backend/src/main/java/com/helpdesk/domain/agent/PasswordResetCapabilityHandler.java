package com.helpdesk.domain.agent;

import com.helpdesk.domain.ticket.entity.Ticket;
import com.helpdesk.domain.user.entity.User;
import com.helpdesk.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.security.SecureRandom;

@Component
@RequiredArgsConstructor
public class PasswordResetCapabilityHandler implements AgentCapabilityHandler {

    private static final Logger log = LoggerFactory.getLogger(PasswordResetCapabilityHandler.class);

    private static final String TEMP_PASSWORD_CHARS =
            "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#%";

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final SecureRandom secureRandom = new SecureRandom();

    @Override
    public String getCapabilityKey() {
        return "PASSWORD_RESET";
    }

    @Override
    public String execute(Ticket ticket) {
        User requester = userRepository.findById(ticket.getCreatedById())
                .orElseThrow(() -> new IllegalStateException("Requester not found for ticket " + ticket.getTicketNumber()));

        String temporaryPassword = generateTemporaryPassword();
        requester.setPasswordHash(passwordEncoder.encode(temporaryPassword));
        userRepository.save(requester);

        // Email sending is paused until mail server details are configured.
        // TODO: switch back to notificationService.sendPasswordResetEmail(requester, temporaryPassword);
        log.info("AI agent password reset for ticket {} - would email {} with temporary password: {}",
                ticket.getTicketNumber(), requester.getEmail(), temporaryPassword);

        return "AI Agent: a temporary password has been generated for " + requester.getEmail() +
                ". Email delivery is currently paused pending mail server setup - please share the credential with the customer manually for now.";
    }

    private String generateTemporaryPassword() {
        StringBuilder sb = new StringBuilder(14);
        for (int i = 0; i < 14; i++) {
            sb.append(TEMP_PASSWORD_CHARS.charAt(secureRandom.nextInt(TEMP_PASSWORD_CHARS.length())));
        }
        return sb.toString();
    }
}
