package com.clinicsaas.entities.enums;

public enum Role {
    ADMIN,          // full access
    DOCTOR,         // clinical: patients, appointments, visits, lab orders, prescriptions, radiology orders, billing-read
    NURSE,          // care: patients, visits/queue, lab-read
    RECEPTIONIST,   // front desk: patients, appointments, billing-read
    LAB_TECHNICIAN, // lab only: see all lab orders, enter results
    RADIOLOGIST,    // radiology only: see all radiology orders, write reports
    PHARMACIST,     // pharmacy only: see and dispense prescriptions
    BILLING_CLERK   // billing only: invoices and payments
}
