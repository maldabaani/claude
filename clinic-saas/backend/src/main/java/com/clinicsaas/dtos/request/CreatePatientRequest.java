package com.clinicsaas.dtos.request;

import com.clinicsaas.entities.enums.BloodType;
import com.clinicsaas.entities.enums.Gender;
import jakarta.validation.constraints.*;

import java.time.LocalDate;

public record CreatePatientRequest(
        @NotBlank @Size(max = 100) String firstName,
        @NotBlank @Size(max = 100) String lastName,
        @NotNull LocalDate dateOfBirth,
        @NotNull Gender gender,
        @Size(max = 30) String phone,
        @Email @Size(max = 255) String email,
        @Size(max = 255) String addressLine1,
        @Size(max = 100) String city,
        @Size(max = 100) String country,
        @Size(max = 200) String emergencyContactName,
        @Size(max = 30) String emergencyContactPhone,
        BloodType bloodType,
        String allergies
) {}
