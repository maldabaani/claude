package com.helpdesk.domain.emailinbox;

import com.helpdesk.domain.ticket.dto.CreateTicketRequest;
import com.helpdesk.domain.ticket.entity.Priority;
import com.helpdesk.domain.ticket.service.TicketService;
import com.helpdesk.domain.user.entity.Role;
import com.helpdesk.domain.user.entity.User;
import com.helpdesk.domain.user.repository.UserRepository;
import com.helpdesk.shared.exception.ResourceNotFoundException;
import jakarta.mail.*;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMultipart;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Properties;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailInboxService {

    private final EmailInboxRepository emailInboxRepository;
    private final UserRepository userRepository;
    private final TicketService ticketService;
    private final PasswordEncoder passwordEncoder;

    public List<EmailInboxDto> findAll() {
        return emailInboxRepository.findAll().stream().map(this::toDto).toList();
    }

    @Transactional
    public EmailInboxDto create(CreateEmailInboxRequest request) {
        EmailInbox inbox = EmailInbox.builder()
                .name(request.name())
                .email(request.email())
                .host(request.host())
                .port(request.port() > 0 ? request.port() : 993)
                .username(request.username())
                .password(request.password())
                .protocol(request.protocol() != null ? request.protocol() : "IMAP")
                .useSsl(request.useSsl())
                .defaultDepartmentId(request.defaultDepartmentId())
                .defaultPriority(request.defaultPriority() != null ? request.defaultPriority() : "MEDIUM")
                .build();
        return toDto(emailInboxRepository.save(inbox));
    }

    @Transactional
    public EmailInboxDto update(UUID id, CreateEmailInboxRequest request) {
        EmailInbox inbox = emailInboxRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("EmailInbox", id));
        inbox.setName(request.name());
        inbox.setEmail(request.email());
        inbox.setHost(request.host());
        inbox.setPort(request.port() > 0 ? request.port() : 993);
        inbox.setUsername(request.username());
        if (request.password() != null && !request.password().isBlank()) {
            inbox.setPassword(request.password());
        }
        inbox.setProtocol(request.protocol() != null ? request.protocol() : "IMAP");
        inbox.setUseSsl(request.useSsl());
        inbox.setDefaultDepartmentId(request.defaultDepartmentId());
        inbox.setDefaultPriority(request.defaultPriority() != null ? request.defaultPriority() : "MEDIUM");
        return toDto(emailInboxRepository.save(inbox));
    }

    @Transactional
    public void delete(UUID id) {
        emailInboxRepository.deleteById(id);
    }

    public String testConnection(UUID id) {
        EmailInbox inbox = emailInboxRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("EmailInbox", id));
        try {
            Properties props = buildMailProperties(inbox);
            Session session = Session.getInstance(props);
            Store store = session.getStore(inbox.isUseSsl() ? "imaps" : "imap");
            store.connect(inbox.getHost(), inbox.getPort(), inbox.getUsername(), inbox.getPassword());
            store.close();
            return "Connection successful";
        } catch (Exception e) {
            return "Connection failed: " + e.getMessage();
        }
    }

    @Transactional
    public void pollInbox(EmailInbox inbox) {
        try {
            Properties props = buildMailProperties(inbox);
            Session session = Session.getInstance(props);
            Store store = session.getStore(inbox.isUseSsl() ? "imaps" : "imap");
            store.connect(inbox.getHost(), inbox.getPort(), inbox.getUsername(), inbox.getPassword());

            Folder folder = store.getFolder("INBOX");
            folder.open(Folder.READ_WRITE);

            Message[] messages = folder.search(new jakarta.mail.search.FlagTerm(
                    new Flags(Flags.Flag.SEEN), false));

            for (Message message : messages) {
                try {
                    processEmail(message, inbox);
                    message.setFlag(Flags.Flag.SEEN, true);
                } catch (Exception e) {
                    log.error("Failed to process email: {}", e.getMessage());
                }
            }

            folder.close(false);
            store.close();

            inbox.setLastCheckedAt(Instant.now());
            emailInboxRepository.save(inbox);
        } catch (Exception e) {
            log.error("Failed to poll inbox {}: {}", inbox.getName(), e.getMessage());
        }
    }

    private void processEmail(Message message, EmailInbox inbox) throws Exception {
        String subject = message.getSubject();
        if (subject == null || subject.isBlank()) subject = "(No Subject)";

        String body = extractTextBody(message);
        String fromEmail = extractFromEmail(message);
        if (fromEmail == null) return;

        // Find or create customer user
        User customer = userRepository.findByEmailAndDeletedAtIsNull(fromEmail).orElseGet(() -> {
            String name = extractFromName(message);
            User newUser = User.builder()
                    .fullName(name != null ? name : fromEmail)
                    .email(fromEmail)
                    .passwordHash("$2a$10$disabled")
                    .role(Role.CUSTOMER)
                    .active(true)
                    .build();
            return userRepository.save(newUser);
        });

        Priority priority = Priority.MEDIUM;
        try { priority = Priority.valueOf(inbox.getDefaultPriority()); } catch (Exception ignored) {}

        CreateTicketRequest request = new CreateTicketRequest(
                subject, body != null ? body : "(No body)", priority,
                null, inbox.getDefaultDepartmentId(), List.of(), null
        );
        ticketService.create(request, customer);
    }

    private String extractTextBody(Message message) throws Exception {
        Object content = message.getContent();
        if (content instanceof String) return (String) content;
        if (content instanceof MimeMultipart mp) {
            for (int i = 0; i < mp.getCount(); i++) {
                BodyPart part = mp.getBodyPart(i);
                if (part.getContentType().startsWith("text/plain")) {
                    return (String) part.getContent();
                }
            }
        }
        return null;
    }

    private String extractFromEmail(Message message) {
        try {
            Address[] from = message.getFrom();
            if (from != null && from.length > 0) {
                return ((InternetAddress) from[0]).getAddress();
            }
        } catch (Exception ignored) {}
        return null;
    }

    private String extractFromName(Message message) {
        try {
            Address[] from = message.getFrom();
            if (from != null && from.length > 0) {
                return ((InternetAddress) from[0]).getPersonal();
            }
        } catch (Exception ignored) {}
        return null;
    }

    private Properties buildMailProperties(EmailInbox inbox) {
        Properties props = new Properties();
        props.setProperty("mail.store.protocol", inbox.isUseSsl() ? "imaps" : "imap");
        if (inbox.isUseSsl()) {
            props.setProperty("mail.imaps.host", inbox.getHost());
            props.setProperty("mail.imaps.port", String.valueOf(inbox.getPort()));
            props.setProperty("mail.imaps.ssl.enable", "true");
        } else {
            props.setProperty("mail.imap.host", inbox.getHost());
            props.setProperty("mail.imap.port", String.valueOf(inbox.getPort()));
        }
        return props;
    }

    public EmailInboxDto toDto(EmailInbox inbox) {
        return new EmailInboxDto(
                inbox.getId(), inbox.getName(), inbox.getEmail(),
                inbox.getHost(), inbox.getPort(), inbox.getUsername(),
                inbox.getProtocol(), inbox.isUseSsl(),
                inbox.getDefaultDepartmentId(), inbox.getDefaultPriority(),
                inbox.isActive(), inbox.getLastCheckedAt()
        );
    }
}
