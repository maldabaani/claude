-- Add SNOOZED to ticket status CHECK constraint
ALTER TABLE tickets DROP CONSTRAINT IF EXISTS tickets_status_check;
ALTER TABLE tickets ADD CONSTRAINT tickets_status_check
    CHECK (status::text = ANY (ARRAY['NEW','OPEN','PENDING','ON_HOLD','RESOLVED','CLOSED','SNOOZED']));
