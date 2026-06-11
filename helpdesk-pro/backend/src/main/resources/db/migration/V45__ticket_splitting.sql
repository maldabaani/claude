ALTER TABLE tickets ADD COLUMN IF NOT EXISTS split_from_id UUID REFERENCES tickets(id);
CREATE INDEX IF NOT EXISTS idx_tickets_split_from ON tickets(split_from_id);
