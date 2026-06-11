package com.helpdesk.domain.kb.service;

import com.helpdesk.domain.kb.dto.KbArticleRequest;
import com.helpdesk.domain.kb.dto.KbArticleResponse;
import com.helpdesk.domain.kb.dto.KbCategoryResponse;
import com.helpdesk.domain.kb.dto.RateRequest;
import com.helpdesk.domain.kb.entity.KbArticle;
import com.helpdesk.domain.kb.entity.KbArticleRating;
import com.helpdesk.domain.kb.entity.KbCategory;
import com.helpdesk.domain.kb.repository.KbArticleRatingRepository;
import com.helpdesk.domain.kb.repository.KbArticleRepository;
import com.helpdesk.domain.kb.repository.KbCategoryRepository;
import com.helpdesk.domain.user.entity.User;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class KbService {

    private final KbCategoryRepository categoryRepository;
    private final KbArticleRepository articleRepository;
    private final KbArticleRatingRepository ratingRepository;

    public List<KbCategoryResponse> getCategories() {
        return categoryRepository.findByDeletedAtIsNullOrderBySortOrderAsc().stream()
                .map(cat -> {
                    long count = articleRepository.findByCategoryIdAndDeletedAtIsNullOrderByTitleAsc(cat.getId())
                            .stream()
                            .filter(a -> "PUBLISHED".equals(a.getStatus()))
                            .count();
                    return new KbCategoryResponse(cat.getId(), cat.getName(), cat.getDescription(), cat.getIcon(), count);
                })
                .toList();
    }

    public List<KbArticleResponse> getPublishedArticles() {
        return articleRepository.findByStatusAndDeletedAtIsNullOrderByCreatedAtDesc("PUBLISHED").stream()
                .map(this::toResponse)
                .toList();
    }

    public List<KbArticleResponse> getArticlesByCategory(UUID categoryId) {
        return articleRepository.findByCategoryIdAndDeletedAtIsNullOrderByTitleAsc(categoryId).stream()
                .map(this::toResponse)
                .toList();
    }

    public List<KbArticleResponse> getAllArticles() {
        return articleRepository.findByDeletedAtIsNullOrderByCreatedAtDesc().stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public KbArticleResponse getArticle(UUID id) {
        KbArticle article = articleRepository.findById(id)
                .filter(a -> a.getDeletedAt() == null)
                .orElseThrow(() -> new EntityNotFoundException("Article not found: " + id));
        return toResponse(article);
    }

    @Transactional
    public KbArticleResponse getArticleBySlug(String slug) {
        KbArticle article = articleRepository.findBySlugAndDeletedAtIsNull(slug)
                .orElseThrow(() -> new EntityNotFoundException("Article not found: " + slug));
        return toResponse(article);
    }

    public List<KbArticleResponse> search(String q) {
        return articleRepository.search(q).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public KbArticleResponse trackView(UUID id) {
        KbArticle article = articleRepository.findById(id)
                .filter(a -> a.getDeletedAt() == null)
                .orElseThrow(() -> new EntityNotFoundException("Article not found: " + id));
        article.setViewCount(article.getViewCount() + 1);
        return toResponse(articleRepository.save(article));
    }

    @Transactional
    public KbArticleResponse rate(UUID id, boolean helpful, User currentUser) {
        KbArticle article = articleRepository.findById(id)
                .filter(a -> a.getDeletedAt() == null)
                .orElseThrow(() -> new EntityNotFoundException("Article not found: " + id));

        UUID userId = currentUser.getId();
        ratingRepository.findByArticleIdAndUserId(id, userId).ifPresentOrElse(
            existing -> {
                // If changing vote, adjust counts
                if (existing.isHelpful() != helpful) {
                    if (existing.isHelpful()) {
                        article.setHelpfulYes(Math.max(0, article.getHelpfulYes() - 1));
                        article.setHelpfulNo(article.getHelpfulNo() + 1);
                    } else {
                        article.setHelpfulNo(Math.max(0, article.getHelpfulNo() - 1));
                        article.setHelpfulYes(article.getHelpfulYes() + 1);
                    }
                    existing.setHelpful(helpful);
                    ratingRepository.save(existing);
                }
            },
            () -> {
                KbArticleRating rating = new KbArticleRating();
                rating.setArticleId(id);
                rating.setUserId(userId);
                rating.setHelpful(helpful);
                ratingRepository.save(rating);
                if (helpful) {
                    article.setHelpfulYes(article.getHelpfulYes() + 1);
                } else {
                    article.setHelpfulNo(article.getHelpfulNo() + 1);
                }
            }
        );

        return toResponse(articleRepository.save(article));
    }

    @Transactional
    public KbArticleResponse create(KbArticleRequest request, User author) {
        String baseSlug = request.title().toLowerCase().replaceAll("[^a-z0-9]+", "-");
        String slug = baseSlug;
        int counter = 2;
        while (articleRepository.findBySlugAndDeletedAtIsNull(slug).isPresent()) {
            slug = baseSlug + "-" + counter++;
        }

        KbArticle article = new KbArticle();
        article.setTitle(request.title());
        article.setBody(request.body());
        article.setCategoryId(request.categoryId());
        article.setStatus(request.status() != null ? request.status() : "DRAFT");
        article.setSlug(slug);
        article.setAuthorId(author.getId());
        return toResponse(articleRepository.save(article));
    }

    @Transactional
    public KbArticleResponse update(UUID id, KbArticleRequest request) {
        KbArticle article = articleRepository.findById(id)
                .filter(a -> a.getDeletedAt() == null)
                .orElseThrow(() -> new EntityNotFoundException("Article not found: " + id));
        article.setTitle(request.title());
        article.setBody(request.body());
        article.setCategoryId(request.categoryId());
        if (request.status() != null) article.setStatus(request.status());
        return toResponse(articleRepository.save(article));
    }

    @Transactional
    public void delete(UUID id) {
        KbArticle article = articleRepository.findById(id)
                .filter(a -> a.getDeletedAt() == null)
                .orElseThrow(() -> new EntityNotFoundException("Article not found: " + id));
        article.softDelete();
        articleRepository.save(article);
    }

    @Transactional
    public void helpful(UUID id, boolean yes) {
        KbArticle article = articleRepository.findById(id)
                .filter(a -> a.getDeletedAt() == null)
                .orElseThrow(() -> new EntityNotFoundException("Article not found: " + id));
        if (yes) {
            article.setHelpfulYes(article.getHelpfulYes() + 1);
        } else {
            article.setHelpfulNo(article.getHelpfulNo() + 1);
        }
        articleRepository.save(article);
    }

    private KbArticleResponse toResponse(KbArticle a) {
        String categoryName = null;
        if (a.getCategoryId() != null) {
            categoryName = categoryRepository.findById(a.getCategoryId())
                    .map(KbCategory::getName)
                    .orElse(null);
        }
        return new KbArticleResponse(
                a.getId(),
                a.getTitle(),
                a.getSlug(),
                a.getBody(),
                a.getStatus(),
                a.getCategoryId(),
                categoryName,
                a.getViewCount(),
                a.getHelpfulYes(),
                a.getHelpfulNo(),
                a.getCreatedAt(),
                a.getUpdatedAt()
        );
    }
}
