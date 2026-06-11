CREATE TABLE nps_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    score INT NOT NULL CHECK (score >= 0 AND score <= 10),
    comment TEXT,
    submitted_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(ticket_id)
);

CREATE INDEX idx_nps_customer ON nps_responses(customer_id);
CREATE INDEX idx_nps_submitted ON nps_responses(submitted_at);
