package com.clinicsaas.pii;

import com.clinicsaas.security.AppUserPrincipal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.AfterReturning;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.scheduling.annotation.Async;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.UUID;

@Slf4j
@Aspect
@Component
@RequiredArgsConstructor
public class PiiAuditAspect {

    private final AuditLogRepository auditLogRepository;

    @AfterReturning("@annotation(auditAccess)")
    public void afterAccess(JoinPoint jp, AuditAccess auditAccess) {
        try {
            writeAudit(jp, auditAccess);
        } catch (Exception ex) {
            // Never let audit failures break the business flow
            log.warn("Audit log write failed: {}", ex.getMessage());
        }
    }

    private void writeAudit(JoinPoint jp, AuditAccess auditAccess) {
        UUID userId    = null;
        String email   = "system";
        String role    = null;

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof AppUserPrincipal p) {
            userId = p.getId();
            email  = p.getUsername();
            role   = auth.getAuthorities().stream()
                         .findFirst().map(a -> a.getAuthority()).orElse(null);
        }

        UUID resourceId = extractUuid(jp.getArgs());
        String ip = resolveIp();

        AuditLog entry = AuditLog.builder()
                .userId(userId)
                .userEmail(email)
                .userRole(role)
                .action(auditAccess.action())
                .resourceType(auditAccess.resourceType())
                .resourceId(resourceId)
                .patientId(resourceId)
                .ipAddress(ip)
                .details(jp.getSignature().getName())
                .build();

        auditLogRepository.save(entry);
    }

    private UUID extractUuid(Object[] args) {
        if (args == null) return null;
        for (Object arg : args) {
            if (arg instanceof UUID u) return u;
        }
        return null;
    }

    private String resolveIp() {
        try {
            var attrs = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attrs == null) return null;
            var req = attrs.getRequest();
            String xff = req.getHeader("X-Forwarded-For");
            return (xff != null && !xff.isBlank()) ? xff.split(",")[0].trim() : req.getRemoteAddr();
        } catch (Exception e) {
            return null;
        }
    }
}
