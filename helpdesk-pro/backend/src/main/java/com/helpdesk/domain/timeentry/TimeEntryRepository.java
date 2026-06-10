package com.helpdesk.domain.timeentry;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface TimeEntryRepository extends JpaRepository<TimeEntry, UUID> {
    List<TimeEntry> findByTicketIdOrderByLoggedAtDesc(UUID ticketId);
    List<TimeEntry> findByAgentIdOrderByLoggedAtDesc(UUID agentId);

    @Query("SELECT COALESCE(SUM(e.minutes), 0) FROM TimeEntry e WHERE e.ticketId = :ticketId")
    Integer sumMinutesByTicketId(@Param("ticketId") UUID ticketId);

    @Query("SELECT e.ticketId, SUM(e.minutes) FROM TimeEntry e GROUP BY e.ticketId ORDER BY SUM(e.minutes) DESC")
    List<Object[]> sumMinutesGroupedByTicket();

    @Query("SELECT e.agentId, SUM(e.minutes) FROM TimeEntry e GROUP BY e.agentId ORDER BY SUM(e.minutes) DESC")
    List<Object[]> sumMinutesGroupedByAgent();

    @Query("SELECT COALESCE(SUM(e.minutes), 0) FROM TimeEntry e WHERE e.loggedAt >= :since")
    Integer sumMinutesSince(@Param("since") java.time.LocalDateTime since);
}
