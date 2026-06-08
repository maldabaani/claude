package com.helpdesk.domain.customfield;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TicketCustomValueRepository extends JpaRepository<TicketCustomValue, TicketCustomValue.TicketCustomValueId> {
    List<TicketCustomValue> findByIdTicketId(UUID ticketId);
    Optional<TicketCustomValue> findByIdTicketIdAndIdFieldKey(UUID ticketId, String fieldKey);
}
