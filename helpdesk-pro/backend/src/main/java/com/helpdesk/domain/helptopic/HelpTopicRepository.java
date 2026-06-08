package com.helpdesk.domain.helptopic;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface HelpTopicRepository extends JpaRepository<HelpTopic, UUID> {
    List<HelpTopic> findByActiveTrueOrderByDisplayOrderAsc();
}
