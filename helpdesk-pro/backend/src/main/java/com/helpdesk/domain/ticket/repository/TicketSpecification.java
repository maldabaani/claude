package com.helpdesk.domain.ticket.repository;

import com.helpdesk.domain.ticket.entity.Priority;
import com.helpdesk.domain.ticket.entity.Ticket;
import com.helpdesk.domain.ticket.entity.TicketStatus;
import org.springframework.data.jpa.domain.Specification;

import java.time.Instant;
import java.util.UUID;

public class TicketSpecification {

    public static Specification<Ticket> notDeleted() {
        return (r, q, cb) -> cb.isNull(r.get("deletedAt"));
    }

    public static Specification<Ticket> withStatus(TicketStatus status) {
        return (r, q, cb) -> status == null ? cb.conjunction() : cb.equal(r.get("status"), status);
    }

    public static Specification<Ticket> withPriority(Priority priority) {
        return (r, q, cb) -> priority == null ? cb.conjunction() : cb.equal(r.get("priority"), priority);
    }

    public static Specification<Ticket> withDepartment(UUID departmentId) {
        return (r, q, cb) -> departmentId == null ? cb.conjunction() : cb.equal(r.get("departmentId"), departmentId);
    }

    public static Specification<Ticket> withAgent(UUID agentId) {
        return (r, q, cb) -> agentId == null ? cb.conjunction() : cb.equal(r.get("assignedAgentId"), agentId);
    }

    public static Specification<Ticket> withCreatedBy(UUID createdById) {
        return (r, q, cb) -> createdById == null ? cb.conjunction() : cb.equal(r.get("createdById"), createdById);
    }

    public static Specification<Ticket> createdAfter(Instant from) {
        return (r, q, cb) -> from == null ? cb.conjunction() : cb.greaterThanOrEqualTo(r.get("createdAt"), from);
    }

    public static Specification<Ticket> createdBefore(Instant to) {
        return (r, q, cb) -> to == null ? cb.conjunction() : cb.lessThanOrEqualTo(r.get("createdAt"), to);
    }

    public static Specification<Ticket> withSearch(String search) {
        return (r, q, cb) -> {
            if (search == null || search.isBlank()) return cb.conjunction();
            String pattern = "%" + search.toLowerCase() + "%";
            return cb.or(
                cb.like(cb.lower(r.get("title")), pattern),
                cb.like(cb.lower(r.get("description")), pattern),
                cb.like(cb.lower(r.get("ticketNumber")), pattern)
            );
        };
    }

    public static Specification<Ticket> filtered(TicketStatus status, Priority priority,
                                                   UUID departmentId, UUID agentId,
                                                   UUID createdById, Instant from, Instant to) {
        return filtered(status, priority, departmentId, agentId, createdById, from, to, null);
    }

    public static Specification<Ticket> excludeSnoozed() {
        return (r, q, cb) -> cb.notEqual(r.get("status"), TicketStatus.SNOOZED);
    }

    public static Specification<Ticket> filtered(TicketStatus status, Priority priority,
                                                   UUID departmentId, UUID agentId,
                                                   UUID createdById, Instant from, Instant to,
                                                   String search) {
        return filtered(status, priority, departmentId, agentId, createdById, from, to, search, false);
    }

    public static Specification<Ticket> filtered(TicketStatus status, Priority priority,
                                                   UUID departmentId, UUID agentId,
                                                   UUID createdById, Instant from, Instant to,
                                                   String search, boolean includeSnoozed) {
        Specification<Ticket> spec = Specification.where(notDeleted())
                .and(withStatus(status))
                .and(withPriority(priority))
                .and(withDepartment(departmentId))
                .and(withAgent(agentId))
                .and(withCreatedBy(createdById))
                .and(createdAfter(from))
                .and(createdBefore(to))
                .and(withSearch(search));
        // Exclude SNOOZED tickets by default unless explicitly filtered for SNOOZED or includeSnoozed=true
        if (!includeSnoozed && status == null) {
            spec = spec.and(excludeSnoozed());
        }
        return spec;
    }
}
