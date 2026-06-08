package com.helpdesk.domain.customfield;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CustomFieldRepository extends JpaRepository<CustomField, UUID> {
    List<CustomField> findByActiveTrueOrderByDisplayOrderAsc();
    Optional<CustomField> findByFieldKey(String fieldKey);
}
