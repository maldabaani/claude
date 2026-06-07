package com.helpdesk.domain.kb.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "kb_articles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class KbArticle {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "category_id")
    private UUID categoryId;

    @Column(nullable = false, length = 300)
    private String title;

    @Column(nullable = false, length = 300, unique = true)
    private String slug;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String body;

    @Column(length = 20)
    private String status = "DRAFT";

    @Column(name = "view_count")
    private int viewCount;

    @Column(name = "helpful_yes")
    private int helpfulYes;

    @Column(name = "helpful_no")
    private int helpfulNo;

    @Column(name = "author_id", nullable = false)
    private UUID authorId;

    @Column(name = "created_at")
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    @Column(name = "deleted_at")
    private Instant deletedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
        updatedAt = Instant.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }

    public void softDelete() {
        this.deletedAt = Instant.now();
    }
}
