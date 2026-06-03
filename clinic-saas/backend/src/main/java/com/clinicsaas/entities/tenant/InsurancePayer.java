package com.clinicsaas.entities.tenant;

import com.clinicsaas.entities.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "insurance_payers")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class InsurancePayer extends BaseEntity {

    @Column(nullable = false, unique = true, length = 200)
    private String name;

    @Column(name = "short_code", nullable = false, unique = true, length = 20)
    private String shortCode;

    @Column(name = "contact_email", length = 200)
    private String contactEmail;

    @Column(name = "portal_url", length = 500)
    private String portalUrl;

    @Builder.Default
    @Column(nullable = false)
    private boolean active = true;
}
