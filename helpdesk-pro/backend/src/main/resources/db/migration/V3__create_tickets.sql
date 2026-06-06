CREATE SEQUENCE ticket_seq START 1 INCREMENT 1;

CREATE TABLE tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_number VARCHAR(30) NOT NULL UNIQUE,
    title VARCHAR(500) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'NEW'
        CHECK (status IN ('NEW','OPEN','PENDING','ON_HOLD','RESOLVED','CLOSED')),
    priority VARCHAR(20) NOT NULL DEFAULT 'MEDIUM'
        CHECK (priority IN ('LOW','MEDIUM','HIGH','CRITICAL')),
    category VARCHAR(100),
    department_id UUID REFERENCES departments(id),
    assigned_agent_id UUID REFERENCES users(id),
    created_by_id UUID NOT NULL REFERENCES users(id),
    sla_policy_id UUID REFERENCES sla_policies(id),
    due_date TIMESTAMPTZ,
    first_response_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    closed_at TIMESTAMPTZ,
    sla_breached BOOLEAN NOT NULL DEFAULT FALSE,
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ
);

CREATE TABLE ticket_tags (
    ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    tag VARCHAR(50) NOT NULL,
    PRIMARY KEY (ticket_id, tag)
);

CREATE INDEX idx_tickets_status ON tickets(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_tickets_priority ON tickets(priority) WHERE deleted_at IS NULL;
CREATE INDEX idx_tickets_created_by ON tickets(created_by_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_tickets_assigned_agent ON tickets(assigned_agent_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_tickets_department ON tickets(department_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_tickets_due_date ON tickets(due_date) WHERE deleted_at IS NULL;
