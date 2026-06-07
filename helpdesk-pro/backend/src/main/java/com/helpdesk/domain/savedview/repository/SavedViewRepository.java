package com.helpdesk.domain.savedview.repository;

import com.helpdesk.domain.savedview.entity.SavedView;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SavedViewRepository extends JpaRepository<SavedView, UUID> {
    List<SavedView> findByUserIdOrderByCreatedAtDesc(UUID userId);
    Optional<SavedView> findByIdAndUserId(UUID id, UUID userId);
}
