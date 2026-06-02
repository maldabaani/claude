-- ─────────────────────────────────────────────────────────────────────────────
-- V9: PII encryption column widening + audit log table
--
-- IMPORTANT: After applying this migration, any existing plaintext data in the
-- affected columns will be unreadable because the application expects AES-256-
-- GCM encrypted values. Drop and recreate dev databases before restarting.
-- In production, run the provided data-migration script first.
-- ─────────────────────────────────────────────────────────────────────────────

-- Widen PII columns to TEXT to accommodate encrypted ciphertext
-- (AES-256-GCM output is ~1.4× larger than plaintext + base64 overhead)
ALTER TABLE patients ALTER COLUMN phone              TYPE TEXT;
ALTER TABLE patients ALTER COLUMN email              TYPE TEXT;
ALTER TABLE patients ALTER COLUMN address_line1      TYPE TEXT;
ALTER TABLE patients ALTER COLUMN city               TYPE TEXT;
ALTER TABLE patients ALTER COLUMN emergency_contact_name  TYPE TEXT;
ALTER TABLE patients ALTER COLUMN emergency_contact_phone TYPE TEXT;

-- ─────────────────────────────────────────────────────────────────────────────
-- Audit log table — INSERT ONLY (application never UPDATEs or DELETEs rows)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE audit_logs (
    id            UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id       UUID,
    user_email    VARCHAR(255),
    user_role     VARCHAR(60),
    action        VARCHAR(80)  NOT NULL,
    resource_type VARCHAR(50),
    resource_id   UUID,
    patient_id    UUID,
    ip_address    VARCHAR(45),
    details       TEXT,
    created_at    TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_patient  ON audit_logs (patient_id);
CREATE INDEX idx_audit_user     ON audit_logs (user_id);
CREATE INDEX idx_audit_time     ON audit_logs (created_at DESC);
CREATE INDEX idx_audit_action   ON audit_logs (action);
