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
            RADIOLOGY_READ, RADIOLOGY_WRITE,
            BILLING_READ,
            REPORTS_READ
        ),

        Role.NURSE, EnumSet.of(
            PATIENT_READ, PATIENT_WRITE,
            APPOINTMENT_READ, APPOINTMENT_WRITE,
            VISIT_READ, VISIT_WRITE,
            LAB_READ, LAB_WRITE,
            RADIOLOGY_READ
        ),

        Role.RECEPTIONIST, EnumSet.of(
            PATIENT_READ, PATIENT_WRITE,
            APPOINTMENT_READ, APPOINTMENT_WRITE,
            VISIT_READ,
            BILLING_READ
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
