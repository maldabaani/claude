-- kb_articles already has view_count, helpful_yes, helpful_no from V9
-- Add a dedicated ratings table to track per-user ratings with upsert support

CREATE TABLE IF NOT EXISTS kb_article_ratings (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id UUID NOT NULL REFERENCES kb_articles(id) ON DELETE CASCADE,
    user_id    UUID REFERENCES users(id) ON DELETE SET NULL,
    ip_address VARCHAR(45),
    helpful    BOOLEAN NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(article_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_kb_ratings_article ON kb_article_ratings(article_id);
