-- Track ticket merge history
CREATE TABLE IF NOT EXISTS ticket_merge_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    target_ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    merged_by UUID REFERENCES users(id) ON DELETE SET NULL,
    merged_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ticket_merge_log_source ON ticket_merge_log(source_ticket_id);
CREATE INDEX idx_ticket_merge_log_target ON ticket_merge_log(target_ticket_id);
