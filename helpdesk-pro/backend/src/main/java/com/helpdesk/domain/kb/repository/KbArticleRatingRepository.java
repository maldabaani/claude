package com.helpdesk.domain.kb.repository;

import com.helpdesk.domain.kb.entity.KbArticleRating;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface KbArticleRatingRepository extends JpaRepository<KbArticleRating, UUID> {
    Optional<KbArticleRating> findByArticleIdAndUserId(UUID articleId, UUID userId);
}
