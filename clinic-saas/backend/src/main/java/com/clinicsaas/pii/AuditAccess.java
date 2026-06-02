package com.clinicsaas.pii;

import java.lang.annotation.*;

/**
 * Marks a service method as touching patient PII.
 * The AOP aspect automatically writes an audit_log entry on every invocation.
 *
 * action      - e.g. "PATIENT_VIEW", "PATIENT_CREATE", "VISIT_VIEW"
 * resourceType - e.g. "PATIENT", "VISIT", "PRESCRIPTION"
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface AuditAccess {
    String action();
    String resourceType();
}
