CREATE TABLE agent_definitions (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description VARCHAR(1000),
    trigger_category VARCHAR(100) NOT NULL,
    keywords JSONB NOT NULL DEFAULT '[]',
    capability VARCHAR(50) NOT NULL,
    auto_close BOOLEAN NOT NULL DEFAULT false,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE agent_execution_logs (
    id BIGSERIAL PRIMARY KEY,
    ticket_id UUID NOT NULL,
    agent_definition_id BIGINT NOT NULL REFERENCES agent_definitions(id),
    outcome VARCHAR(50) NOT NULL,
    detail VARCHAR(1000),
    executed_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_agent_execution_logs_ticket ON agent_execution_logs(ticket_id, agent_definition_id);

INSERT INTO agent_definitions (name, description, trigger_category, keywords, capability, auto_close, active)
VALUES (
    'Account Access Agent',
    'Auto-resolves password-reset / account-access tickets by generating a temporary password.',
    'account',
    '["password", "reset", "locked out", "can''t log in", "cannot log in", "can''t login", "cannot login", "forgot password", "login issue", "unable to login"]',
    'PASSWORD_RESET',
    true,
    true
);
