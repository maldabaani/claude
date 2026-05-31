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
        return new PatientResponse(p.getId(), p.getMedicalRecordNumber(),
                p.getFirstName(), p.getLastName(), p.getDateOfBirth(),
                p.getGender(), p.getPhone(), p.getEmail(),
                p.getCity(), p.getCountry(), p.getBloodType());
    }
}
