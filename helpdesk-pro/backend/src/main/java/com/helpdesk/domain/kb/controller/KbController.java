package com.helpdesk.domain.kb.controller;

import com.helpdesk.domain.kb.dto.KbArticleRequest;
import com.helpdesk.domain.kb.dto.KbArticleResponse;
import com.helpdesk.domain.kb.dto.KbCategoryResponse;
import com.helpdesk.domain.kb.dto.RateRequest;
import com.helpdesk.domain.kb.service.KbService;
import com.helpdesk.domain.user.entity.User;
import com.helpdesk.shared.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/kb")
@RequiredArgsConstructor
public class KbController {

    private final KbService kbService;

    @GetMapping("/categories")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<KbCategoryResponse>>> getCategories() {
        return ResponseEntity.ok(ApiResponse.ok(kbService.getCategories()));
    }

    @GetMapping("/articles")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<KbArticleResponse>>> getArticles(
            @RequestParam(required = false) UUID categoryId) {
        List<KbArticleResponse> articles = categoryId != null
                ? kbService.getArticlesByCategory(categoryId)
                : kbService.getAllArticles();
        return ResponseEntity.ok(ApiResponse.ok(articles));
    }

    @GetMapping("/articles/search")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<KbArticleResponse>>> search(@RequestParam String q) {
        return ResponseEntity.ok(ApiResponse.ok(kbService.search(q)));
    }

    @GetMapping("/articles/slug/{slug}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<KbArticleResponse>> getBySlug(@PathVariable String slug) {
        return ResponseEntity.ok(ApiResponse.ok(kbService.getArticleBySlug(slug)));
    }

    @GetMapping("/articles/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<KbArticleResponse>> getArticle(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(kbService.getArticle(id)));
    }

    @PostMapping("/articles/{id}/view")
    public ResponseEntity<ApiResponse<KbArticleResponse>> trackView(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(kbService.trackView(id)));
    }

    @PostMapping("/articles/{id}/rate")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<KbArticleResponse>> rate(
            @PathVariable UUID id,
            @RequestBody RateRequest request,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(ApiResponse.ok(kbService.rate(id, request.helpful(), currentUser)));
    }

    @PostMapping("/articles")
    @PreAuthorize("hasAnyRole('AGENT','TEAM_LEAD','ADMIN')")
    public ResponseEntity<ApiResponse<KbArticleResponse>> create(
            @Valid @RequestBody KbArticleRequest request,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(ApiResponse.ok("Article created", kbService.create(request, currentUser)));
    }

    @PutMapping("/articles/{id}")
    @PreAuthorize("hasAnyRole('AGENT','TEAM_LEAD','ADMIN')")
    public ResponseEntity<ApiResponse<KbArticleResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody KbArticleRequest request) {
        return ResponseEntity.ok(ApiResponse.ok("Article updated", kbService.update(id, request)));
    }

    @DeleteMapping("/articles/{id}")
    @PreAuthorize("hasAnyRole('TEAM_LEAD','ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        kbService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok("Article deleted", null));
    }

    @PostMapping("/articles/{id}/helpful")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Void>> helpful(
            @PathVariable UUID id,
            @RequestParam boolean yes) {
        kbService.helpful(id, yes);
        return ResponseEntity.ok(ApiResponse.ok("Feedback recorded", null));
    }
}
