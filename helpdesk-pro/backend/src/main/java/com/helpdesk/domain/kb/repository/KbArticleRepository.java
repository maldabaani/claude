package com.helpdesk.domain.kb.repository;

import com.helpdesk.domain.kb.entity.KbArticle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface KbArticleRepository extends JpaRepository<KbArticle, UUID> {
    List<KbArticle> findByDeletedAtIsNullOrderByCreatedAtDesc();
    List<KbArticle> findByCategoryIdAndDeletedAtIsNullOrderByTitleAsc(UUID categoryId);
    List<KbArticle> findByStatusAndDeletedAtIsNullOrderByCreatedAtDesc(String status);
    Optional<KbArticle> findBySlugAndDeletedAtIsNull(String slug);

    @Query(value = "SELECT * FROM kb_articles WHERE deleted_at IS NULL AND status='PUBLISHED' AND (LOWER(title) LIKE LOWER(CONCAT('%',:q,'%')) OR LOWER(body) LIKE LOWER(CONCAT('%',:q,'%')))", nativeQuery = true)
    List<KbArticle> search(@Param("q") String q);
}
