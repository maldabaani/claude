package com.clinicsaas.security;

import com.clinicsaas.entities.enums.Permission;
import com.clinicsaas.entities.enums.Role;

import java.util.Collections;
import java.util.EnumSet;
import java.util.Map;
import java.util.Set;

import static com.clinicsaas.entities.enums.Permission.*;

public final class RolePermissions {

    private static final Map<Role, Set<Permission>> MAP = Map.of(
        Role.ADMIN, EnumSet.allOf(Permission.class),

        Role.DOCTOR, EnumSet.of(
            PATIENT_READ, PATIENT_WRITE,
            APPOINTMENT_READ, APPOINTMENT_WRITE,
            VISIT_READ, VISIT_WRITE,
            LAB_READ, LAB_WRITE,
            PRESCRIPTION_READ, PRESCRIPTION_WRITE,
            RADIOLOGY_READ, RADIOLOGY_WRITE,  // doctors ORDER radiology
            BILLING_READ,
            REPORTS_READ
        ),

        Role.NURSE, EnumSet.of(
            PATIENT_READ, PATIENT_WRITE,
            VISIT_READ, VISIT_WRITE,      // queue + vitals
            LAB_READ                      // see results only
        ),

        Role.RECEPTIONIST, EnumSet.of(
            PATIENT_READ, PATIENT_WRITE,
            APPOINTMENT_READ, APPOINTMENT_WRITE,
            BILLING_READ
        ),

        Role.LAB_TECHNICIAN, EnumSet.of(
            LAB_READ, LAB_WRITE           // ONLY lab orders + enter results
        ),

        Role.RADIOLOGIST, EnumSet.of(
            RADIOLOGY_READ, RADIOLOGY_WRITE  // ONLY radiology orders + write reports
        ),

        Role.PHARMACIST, EnumSet.of(
            PRESCRIPTION_READ, PRESCRIPTION_WRITE  // ONLY prescriptions
        ),

        Role.BILLING_CLERK, EnumSet.of(
            BILLING_READ, BILLING_WRITE   // ONLY invoices + payments
        )
    );

    private RolePermissions() {}

    public static Set<Permission> forRole(Role role) {
        return MAP.getOrDefault(role, Collections.emptySet());
    }

    public static Set<Permission> forRole(String roleName) {
        try {
            return forRole(Role.valueOf(roleName));
        } catch (IllegalArgumentException e) {
            return Collections.emptySet();
        }
    }
}
