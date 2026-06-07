CREATE TABLE canned_responses (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title       VARCHAR(200) NOT NULL,
    body        TEXT NOT NULL,
    category    VARCHAR(100),
    created_by_id UUID NOT NULL REFERENCES users(id),
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at  TIMESTAMP WITH TIME ZONE
);
CREATE INDEX idx_canned_responses_category ON canned_responses(category) WHERE deleted_at IS NULL;
