package com.clinicsaas.entities.tenant;

import com.clinicsaas.entities.enums.BloodType;
import com.clinicsaas.entities.enums.Gender;
import com.clinicsaas.pii.EncryptedStringConverter;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "patients")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Patient {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    // MRN stays plaintext — used for lookup and search
    @Column(name = "mrn", nullable = false, unique = true, length = 20)
    private String medicalRecordNumber;

    // Names stay plaintext — required for LIKE search queries.
    // All contact details and medical notes are encrypted at rest (AES-256-GCM).
    @Column(name = "first_name", nullable = false, length = 100)
    private String firstName;

    @Column(name = "last_name", nullable = false, length = 100)
    private String lastName;

    @Column(name = "date_of_birth", nullable = false)
    private LocalDate dateOfBirth;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private Gender gender;

    @Convert(converter = EncryptedStringConverter.class)
    @Column(columnDefinition = "TEXT")
    private String phone;

    @Convert(converter = EncryptedStringConverter.class)
    @Column(columnDefinition = "TEXT")
    private String email;

    @Convert(converter = EncryptedStringConverter.class)
    @Column(name = "address_line1", columnDefinition = "TEXT")
    private String addressLine1;

    @Convert(converter = EncryptedStringConverter.class)
    @Column(columnDefinition = "TEXT")
    private String city;

    @Column(length = 100)
    private String country;

    @Convert(converter = EncryptedStringConverter.class)
    @Column(name = "emergency_contact_name", columnDefinition = "TEXT")
    private String emergencyContactName;

    @Convert(converter = EncryptedStringConverter.class)
    @Column(name = "emergency_contact_phone", columnDefinition = "TEXT")
    private String emergencyContactPhone;

    @Enumerated(EnumType.STRING)
    @Column(name = "blood_type", length = 15)
    private BloodType bloodType;

    @Convert(converter = EncryptedStringConverter.class)
    @Column(columnDefinition = "TEXT")
    private String allergies;

    @Column(nullable = false)
    @Builder.Default
    private boolean active = true;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
