package com.helpdesk.domain.customfield;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "custom_fields")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CustomField {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String name;

    @Column(name = "field_key", nullable = false, unique = true)
    private String fieldKey;

    @Column(name = "field_type", nullable = false)
    private String fieldType;

    @Column(columnDefinition = "TEXT")
    private String options;

    @Column(nullable = false)
    @Builder.Default
    private boolean required = false;

    @Column(name = "display_order")
    @Builder.Default
    private int displayOrder = 0;

    @Column(nullable = false)
    @Builder.Default
    private boolean active = true;

    @Column(name = "created_at")
    @Builder.Default
    private Instant createdAt = Instant.now();
}
