package com.helpdesk.domain.ticket.repository;

import com.helpdesk.domain.ticket.entity.TicketWatcher;
import com.helpdesk.domain.ticket.entity.TicketWatcherId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TicketWatcherRepository extends JpaRepository<TicketWatcher, TicketWatcherId> {
    List<TicketWatcher> findByTicketId(UUID ticketId);
    void deleteByTicketIdAndEmail(UUID ticketId, String email);
}
