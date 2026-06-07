CREATE TABLE ticket_watchers (
    ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    added_by UUID REFERENCES users(id) ON DELETE SET NULL,
    added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    PRIMARY KEY (ticket_id, email)
);

CREATE INDEX idx_ticket_watchers_ticket_id ON ticket_watchers(ticket_id);
