package com.clinicsaas.dtos.response;

import com.clinicsaas.entities.enums.BloodType;
import com.clinicsaas.entities.enums.Gender;
import com.clinicsaas.entities.tenant.Patient;

import java.time.LocalDate;
import java.util.UUID;

public record PatientResponse(
        UUID id,
        String mrn,
        String firstName,
        String lastName,
        LocalDate dateOfBirth,
        Gender gender,
        String phone,
        String email,
        String city,
        String country,
        BloodType bloodType
) {
    public static PatientResponse from(Patient p) {
        return from(p, false);
    }

    public static PatientResponse masked(Patient p) {
        return from(p, true);
    }

    private static PatientResponse from(Patient p, boolean mask) {
        String phone = (mask && p.getPhone() != null) ? maskPhone(p.getPhone()) : p.getPhone();
        String email = (mask && p.getEmail() != null) ? maskEmail(p.getEmail()) : p.getEmail();
        return new PatientResponse(
            p.getId(), p.getMedicalRecordNumber(),
            p.getFirstName(), p.getLastName(), p.getDateOfBirth(),
            p.getGender(), phone, email,
            p.getCity(), p.getCountry(), p.getBloodType()
        );
    }

    private static String maskPhone(String phone) {
        int len = phone.replaceAll("[^0-9]", "").length();
        if (len <= 4) return "****";
        return "*".repeat(len - 4) + phone.substring(phone.length() - 4);
    }

    private static String maskEmail(String email) {
        int at = email.indexOf('@');
        if (at <= 1) return "****@****";
        return email.substring(0, 1) + "****" + email.substring(at);
    }
}
