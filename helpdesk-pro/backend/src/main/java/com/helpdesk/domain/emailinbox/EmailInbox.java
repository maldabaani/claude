package com.helpdesk.domain.emailinbox;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "email_inboxes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmailInbox {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String email;

    @Column(nullable = false)
    private String host;

    @Builder.Default
    private int port = 993;

    @Column(nullable = false)
    private String username;

    @Column(nullable = false)
    private String password;

    @Builder.Default
    private String protocol = "IMAP";

    @Column(name = "use_ssl")
    @Builder.Default
    private boolean useSsl = true;

    @Column(name = "default_department_id")
    private UUID defaultDepartmentId;

    @Column(name = "default_priority")
    @Builder.Default
    private String defaultPriority = "MEDIUM";

    @Builder.Default
    private boolean active = true;

    @Column(name = "last_checked_at")
    private Instant lastCheckedAt;

    @Column(name = "created_at")
    @Builder.Default
    private Instant createdAt = Instant.now();
}
