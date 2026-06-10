CREATE TABLE ticket_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    target_ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    link_type VARCHAR(30) NOT NULL,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(source_ticket_id, target_ticket_id, link_type),
    CHECK (source_ticket_id != target_ticket_id)
);
CREATE INDEX idx_ticket_links_source ON ticket_links(source_ticket_id);
CREATE INDEX idx_ticket_links_target ON ticket_links(target_ticket_id);
