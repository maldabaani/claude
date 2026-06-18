package com.helpdesk.domain.template;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.UUID;

public interface TicketTemplateRepository extends JpaRepository<TicketTemplate, UUID> {
    List<TicketTemplate> findByActiveTrue();

    @Query("SELECT DISTINCT t.category FROM TicketTemplate t WHERE t.category IS NOT NULL AND t.category <> ''")
    List<String> findDistinctCategories();
}
