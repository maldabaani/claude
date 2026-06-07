package com.helpdesk.domain.kb.repository;

import com.helpdesk.domain.kb.entity.KbCategory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface KbCategoryRepository extends JpaRepository<KbCategory, UUID> {
    List<KbCategory> findByDeletedAtIsNullOrderBySortOrderAsc();
}
