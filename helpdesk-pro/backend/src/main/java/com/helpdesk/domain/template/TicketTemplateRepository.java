package com.helpdesk.domain.template;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface TicketTemplateRepository extends JpaRepository<TicketTemplate, UUID> {
    List<TicketTemplate> findByActiveTrue();
}
