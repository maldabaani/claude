package com.helpdesk.domain.audit.service;

import com.helpdesk.domain.audit.dto.AuditLogResponse;
import com.helpdesk.domain.audit.entity.AuditLog;
import com.helpdesk.domain.audit.repository.AuditLogRepository;
import com.helpdesk.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;
    private final UserRepository userRepository;

    public Page<AuditLogResponse> getAuditLogs(String entityType, String action, UUID actorId, Pageable pageable) {
        Specification<AuditLog> spec = Specification.where(null);

        if (entityType != null && !entityType.isBlank()) {
            spec = spec.and((r, q, cb) -> cb.equal(r.get("entityType"), entityType));
        }
        if (action != null && !action.isBlank()) {
            spec = spec.and((r, q, cb) -> cb.equal(r.get("action"), action));
        }
        if (actorId != null) {
            spec = spec.and((r, q, cb) -> cb.equal(r.get("performedById"), actorId));
        }

        return auditLogRepository.findAll(spec, pageable).map(this::toResponse);
    }

    public void log(String entityType, UUID entityId, String action, UUID performedById) {
        log(entityType, entityId, action, performedById, null, null);
    }

    public void log(String entityType, UUID entityId, String action, UUID performedById, String oldValue, String newValue) {
        AuditLog entry = AuditLog.builder()
            .entityType(entityType)
            .entityId(entityId)
            .action(action)
            .performedById(performedById)
            .oldValue(oldValue)
            .newValue(newValue)
            .build();
        auditLogRepository.save(entry);
    }

    private AuditLogResponse toResponse(AuditLog log) {
        String actorName = log.getPerformedById() != null
            ? userRepository.findById(log.getPerformedById())
                .map(u -> u.getFullName())
                .orElse("Unknown")
            : "System";
        return new AuditLogResponse(
            log.getId(), log.getEntityType(), log.getEntityId(),
            log.getAction(), log.getPerformedById(), actorName,
            log.getOldValue(), log.getNewValue(), log.getCreatedAt()
        );
    }
}
