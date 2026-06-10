package com.helpdesk.domain.ticket.repository;

import com.helpdesk.domain.ticket.entity.TicketDraft;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface TicketDraftRepository extends JpaRepository<TicketDraft, UUID> {
    Optional<TicketDraft> findByTicketIdAndAgentId(UUID ticketId, UUID agentId);
    void deleteByTicketIdAndAgentId(UUID ticketId, UUID agentId);
}
