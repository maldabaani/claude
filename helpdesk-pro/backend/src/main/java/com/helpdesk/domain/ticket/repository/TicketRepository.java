package com.helpdesk.domain.ticket.repository;

import com.helpdesk.domain.ticket.entity.Priority;
import com.helpdesk.domain.ticket.entity.Ticket;
import com.helpdesk.domain.ticket.entity.TicketStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
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
}
