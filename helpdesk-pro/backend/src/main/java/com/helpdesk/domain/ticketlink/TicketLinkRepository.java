package com.helpdesk.domain.ticketlink;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface TicketLinkRepository extends JpaRepository<TicketLink, UUID> {
    List<TicketLink> findBySourceTicketId(UUID sourceTicketId);
    List<TicketLink> findByTargetTicketId(UUID targetTicketId);
    void deleteBySourceTicketIdAndTargetTicketIdAndLinkType(UUID sourceId, UUID targetId, LinkType linkType);
}
