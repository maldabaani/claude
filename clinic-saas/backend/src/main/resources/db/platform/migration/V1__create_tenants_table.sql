CREATE TABLE IF NOT EXISTS tenants (
    id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(100) NOT NULL UNIQUE,
    db_name     VARCHAR(63)  NOT NULL UNIQUE,
    admin_email VARCHAR(255) NOT NULL UNIQUE,
    active      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tenants_db_name ON tenants (db_name);
CREATE INDEX idx_tenants_active  ON tenants (active);
