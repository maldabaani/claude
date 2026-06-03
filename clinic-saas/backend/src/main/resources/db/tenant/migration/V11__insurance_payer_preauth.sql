CREATE TABLE IF NOT EXISTS insurance_payers (
    id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    name         VARCHAR(200) NOT NULL UNIQUE,
    short_code   VARCHAR(20)  NOT NULL UNIQUE,
    contact_email VARCHAR(200),
    portal_url   VARCHAR(500),
    active       BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at   TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMP
);

INSERT INTO insurance_payers (name, short_code, contact_email, active) VALUES
  ('Daman - National Health Insurance Company', 'DAMAN', 'providers@damanhealth.ae', TRUE),
  ('AXA Gulf', 'AXA', 'providers@axa-gulf.com', TRUE),
  ('Oman Insurance Company', 'OIC', 'medical@tameen.ae', TRUE),
  ('ADNIC - Abu Dhabi National Insurance', 'ADNIC', 'health@adnic.ae', TRUE),
  ('MetLife Gulf', 'METLIFE', 'claims@metlife.com', TRUE),
  ('NAS - National Administration Services', 'NAS', 'providers@nas-tpa.com', TRUE),
  ('GIG Gulf (formerly Gulf Insurance)', 'GIG', 'health@giggulf.com', TRUE),
  ('Neuron', 'NEURON', 'providers@neuron-tpa.com', TRUE),
  ('MedNet', 'MEDNET', 'providers@mednet-me.com', TRUE),
  ('MSH International', 'MSH', 'providers@msh-intl.com', TRUE)
ON CONFLICT (short_code) DO NOTHING;

ALTER TABLE insurance_policies
    ADD COLUMN IF NOT EXISTS payer_id UUID REFERENCES insurance_payers(id),
    ADD COLUMN IF NOT EXISTS notes TEXT;

ALTER TABLE invoices
    ADD COLUMN IF NOT EXISTS insurance_policy_id     UUID REFERENCES insurance_policies(id),
    ADD COLUMN IF NOT EXISTS patient_liability_amount  NUMERIC(12,2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS insurance_liability_amount NUMERIC(12,2) NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS pre_authorizations (
    id                   UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id           UUID         NOT NULL REFERENCES patients(id),
    insurance_policy_id  UUID         NOT NULL REFERENCES insurance_policies(id),
    visit_id             UUID         REFERENCES visits(id),
    preauth_number       VARCHAR(50)  UNIQUE,
    service_description  VARCHAR(500) NOT NULL,
    icd_code             VARCHAR(20),
    estimated_amount     NUMERIC(12,2),
    status               VARCHAR(20)  NOT NULL DEFAULT 'DRAFT',
    approval_number      VARCHAR(100),
    valid_until          DATE,
    rejection_reason     TEXT,
    notes                TEXT,
    submitted_at         TIMESTAMP,
    processed_at         TIMESTAMP,
    requested_by         UUID,
    created_at           TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMP
);

CREATE INDEX idx_preauth_patient ON pre_authorizations(patient_id);
CREATE INDEX idx_preauth_policy  ON pre_authorizations(insurance_policy_id);
CREATE INDEX idx_preauth_status  ON pre_authorizations(status);
CREATE INDEX idx_ins_policy_payer ON insurance_policies(payer_id);
CREATE INDEX idx_invoice_ins_policy ON invoices(insurance_policy_id);
