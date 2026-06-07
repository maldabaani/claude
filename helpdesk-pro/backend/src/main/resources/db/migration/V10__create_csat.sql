CREATE TABLE csat_ratings (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id   UUID NOT NULL UNIQUE REFERENCES tickets(id),
    customer_id UUID NOT NULL REFERENCES users(id),
    agent_id    UUID REFERENCES users(id),
    rating      INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment     TEXT,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX idx_csat_agent ON csat_ratings(agent_id);
