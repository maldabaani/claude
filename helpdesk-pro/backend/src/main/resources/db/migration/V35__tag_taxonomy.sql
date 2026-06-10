CREATE TABLE tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL UNIQUE,
    color VARCHAR(7) NOT NULL DEFAULT '#6366F1',
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Link tickets to managed tags (keep existing ticket_tags text column for backward compat)
CREATE TABLE ticket_tag_links (
    ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (ticket_id, tag_id)
);

CREATE INDEX idx_ticket_tag_links_tag ON ticket_tag_links(tag_id);
