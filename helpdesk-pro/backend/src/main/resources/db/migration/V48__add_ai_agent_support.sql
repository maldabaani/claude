ALTER TABLE tickets ADD COLUMN closed_by_ai BOOLEAN NOT NULL DEFAULT FALSE;

INSERT INTO users (id, full_name, email, password_hash, role, active)
VALUES (
    'a0000000-0000-0000-0000-00000000a1ae',
    'AI Agent',
    'ai-agent@system.local',
    '$2a$10$HUznbMdLLmNUBRkQTRGN9uTnplZ5Ufk.FIz5kl6Idw4BerjB69jTC',
    'AGENT',
    false
);
