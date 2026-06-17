package com.helpdesk.domain.ticket.repository;

import com.helpdesk.domain.ticket.entity.Ticket;
import com.helpdesk.domain.ticket.entity.TicketStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TicketRepository extends JpaRepository<Ticket, UUID>, JpaSpecificationExecutor<Ticket> {

    Optional<Ticket> findByIdAndDeletedAtIsNull(UUID id);

    @Query("SELECT t FROM Ticket t WHERE t.deletedAt IS NULL AND t.slaBreached = false AND t.dueDate < :now AND t.status NOT IN ('RESOLVED', 'CLOSED')")
    List<Ticket> findSlaBreachedTickets(@Param("now") Instant now);

    @Query("SELECT COUNT(t) FROM Ticket t WHERE t.deletedAt IS NULL AND t.status = :status")
    long countByStatus(@Param("status") TicketStatus status);

    @Query("SELECT COUNT(t) FROM Ticket t WHERE t.deletedAt IS NULL AND t.slaBreached = true AND t.status NOT IN ('RESOLVED', 'CLOSED')")
    long countActiveSlaBreached();

    @Query("SELECT COUNT(t) FROM Ticket t WHERE t.deletedAt IS NULL AND t.resolvedAt >= :since")
    long countResolvedSince(@Param("since") Instant since);

    @Query("SELECT COUNT(t) FROM Ticket t WHERE t.deletedAt IS NULL AND t.assignedAgentId = :agentId AND t.status NOT IN ('RESOLVED', 'CLOSED')")
    long countOpenByAgent(@Param("agentId") UUID agentId);

    @Query("SELECT t.assignedAgentId, COUNT(t) FROM Ticket t WHERE t.deletedAt IS NULL AND t.departmentId = :departmentId AND t.status NOT IN ('RESOLVED','CLOSED') GROUP BY t.assignedAgentId ORDER BY COUNT(t)")
    List<Object[]> findAgentLoadByDepartment(@Param("departmentId") UUID departmentId);

    @Query(value = "SELECT DATE_TRUNC('day', created_at) as day, COUNT(*) as cnt FROM tickets WHERE deleted_at IS NULL AND created_at >= :since GROUP BY DATE_TRUNC('day', created_at) ORDER BY day", nativeQuery = true)
    List<Object[]> countByDay(@Param("since") Instant since);

    @Query(value = "SELECT COALESCE(AVG(EXTRACT(EPOCH FROM (resolved_at - created_at))/3600.0), 0) FROM tickets WHERE deleted_at IS NULL AND resolved_at IS NOT NULL AND created_at >= :since", nativeQuery = true)
    Double avgResolutionHours(@Param("since") Instant since);

    @Query(value = "SELECT assigned_agent_id, COUNT(*) as total, SUM(CASE WHEN status IN ('RESOLVED','CLOSED') THEN 1 ELSE 0 END) as resolved FROM tickets WHERE deleted_at IS NULL AND assigned_agent_id IS NOT NULL GROUP BY assigned_agent_id ORDER BY total DESC", nativeQuery = true)
    List<Object[]> agentStats();

    @Query("SELECT t FROM Ticket t WHERE t.deletedAt IS NULL AND t.status = com.helpdesk.domain.ticket.entity.TicketStatus.SNOOZED AND t.snoozedUntil <= :now")
    List<Ticket> findExpiredSnoozedTickets(@Param("now") LocalDateTime now);

    List<Ticket> findByCreatedByIdAndDeletedAtIsNullOrderByCreatedAtDesc(UUID createdById);

    @Query(value = "SELECT COUNT(*) FROM tickets WHERE deleted_at IS NULL AND assigned_agent_id = :agentId AND status = 'RESOLVED' AND resolved_at >= :from AND resolved_at <= :to", nativeQuery = true)
    long countResolvedByAgentInRange(@Param("agentId") UUID agentId, @Param("from") Instant from, @Param("to") Instant to);

    @Query(value = "SELECT COALESCE(AVG(EXTRACT(EPOCH FROM (first_response_at - created_at))/60.0), 0) FROM tickets WHERE deleted_at IS NULL AND assigned_agent_id = :agentId AND first_response_at IS NOT NULL AND created_at >= :from AND created_at <= :to", nativeQuery = true)
    Double avgFirstResponseMinutesByAgent(@Param("agentId") UUID agentId, @Param("from") Instant from, @Param("to") Instant to);

    @Query(value = "SELECT COALESCE(AVG(EXTRACT(EPOCH FROM (resolved_at - created_at))/60.0), 0) FROM tickets WHERE deleted_at IS NULL AND assigned_agent_id = :agentId AND resolved_at IS NOT NULL AND created_at >= :from AND created_at <= :to", nativeQuery = true)
    Double avgResolutionMinutesByAgent(@Param("agentId") UUID agentId, @Param("from") Instant from, @Param("to") Instant to);

}
