package com.helpdesk.domain.department.entity;

import com.helpdesk.shared.audit.AuditableEntity;
import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "departments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Department extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true)
    private String name;

    private String description;

    @Column(name = "inbound_email")
    private String inboundEmail;

    @Column(name = "team_lead_id")
    private UUID teamLeadId;

    @Column(nullable = false)
    @Builder.Default
    private boolean active = true;
}
