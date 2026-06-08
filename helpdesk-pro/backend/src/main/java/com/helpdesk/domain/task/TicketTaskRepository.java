package com.helpdesk.domain.task;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface TicketTaskRepository extends JpaRepository<TicketTask, UUID> {
    List<TicketTask> findByTicketIdOrderByCreatedAtAsc(UUID ticketId);
}
