CREATE TABLE agent_capability_definitions (
    id BIGSERIAL PRIMARY KEY,
    key VARCHAR(100) NOT NULL UNIQUE,
    label VARCHAR(255) NOT NULL,
    description VARCHAR(1000),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

INSERT INTO agent_capability_definitions (key, label, description)
VALUES (
    'PASSWORD_RESET',
    'Password Reset',
    'Generates a temporary password and applies it to the requester''s account.'
);
