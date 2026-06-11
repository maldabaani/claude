package com.helpdesk.domain.tag;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface TicketTagLinkRepository extends JpaRepository<TicketTagLink, TicketTagLinkId> {
    List<TicketTagLink> findByTicketId(UUID ticketId);

    @Query("SELECT COUNT(l) FROM TicketTagLink l WHERE l.tagId = :tagId")
    long countByTagId(@Param("tagId") UUID tagId);

    @Modifying
    @Query("DELETE FROM TicketTagLink l WHERE l.ticketId = :ticketId")
    void deleteByTicketId(@Param("ticketId") UUID ticketId);

    @Modifying
    @Query("UPDATE TicketTagLink l SET l.tagId = :targetId WHERE l.tagId = :sourceId AND NOT EXISTS (SELECT 1 FROM TicketTagLink l2 WHERE l2.ticketId = l.ticketId AND l2.tagId = :targetId)")
    void reassignLinks(@Param("sourceId") UUID sourceId, @Param("targetId") UUID targetId);

    @Modifying
    @Query("DELETE FROM TicketTagLink l WHERE l.tagId = :tagId")
    void deleteByTagId(@Param("tagId") UUID tagId);
}
