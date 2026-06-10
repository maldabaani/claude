CREATE TABLE round_robin_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    department_id UUID REFERENCES departments(id) ON DELETE CASCADE,
    is_enabled BOOLEAN NOT NULL DEFAULT false,
    last_assigned_agent_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_rr_department ON round_robin_config(department_id) WHERE department_id IS NOT NULL;
CREATE UNIQUE INDEX idx_rr_global ON round_robin_config((department_id IS NULL)) WHERE department_id IS NULL;
