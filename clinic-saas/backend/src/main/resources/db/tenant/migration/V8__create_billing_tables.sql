CREATE TABLE IF NOT EXISTS insurance_policies (
    id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id           UUID        NOT NULL REFERENCES patients(id),
    insurer_name         VARCHAR(200) NOT NULL,
    policy_number        VARCHAR(100) NOT NULL,
    member_number        VARCHAR(100),
    group_number         VARCHAR(100),
    coverage_type        VARCHAR(100),
    valid_from           DATE,
    valid_to             DATE,
    copay_amount         NUMERIC(10,2),
    deductible_amount    NUMERIC(10,2),
    coverage_percentage  NUMERIC(5,2),
    active               BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at           TIMESTAMP   NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMP
);

CREATE INDEX idx_insurance_patient ON insurance_policies(patient_id, active);

CREATE TABLE IF NOT EXISTS invoices (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id      UUID        NOT NULL REFERENCES patients(id),
    visit_id        UUID        REFERENCES visits(id),
    invoice_number  VARCHAR(30) NOT NULL UNIQUE,
    status          VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    subtotal        NUMERIC(12,2) NOT NULL DEFAULT 0,
    tax_amount      NUMERIC(12,2) NOT NULL DEFAULT 0,
    discount_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    total_amount    NUMERIC(12,2) NOT NULL DEFAULT 0,
    paid_amount     NUMERIC(12,2) NOT NULL DEFAULT 0,
    due_date        DATE,
    issued_at       TIMESTAMP,
    paid_at         TIMESTAMP,
    notes           TEXT,
    created_at      TIMESTAMP   NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP
);

CREATE INDEX idx_invoices_patient ON invoices(patient_id);
CREATE INDEX idx_invoices_visit   ON invoices(visit_id);
CREATE INDEX idx_invoices_status  ON invoices(status);
CREATE INDEX idx_invoices_number  ON invoices(invoice_number);

CREATE TABLE IF NOT EXISTS invoice_items (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id      UUID        NOT NULL REFERENCES invoices(id),
    service_type    VARCHAR(20) NOT NULL,
    description     VARCHAR(300) NOT NULL,
    reference_id    UUID,
    quantity        NUMERIC(6,2) NOT NULL DEFAULT 1,
    unit_price      NUMERIC(10,2) NOT NULL,
    discount_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
    total_price     NUMERIC(10,2) NOT NULL,
    created_at      TIMESTAMP   NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP
);

CREATE INDEX idx_invoice_items_invoice ON invoice_items(invoice_id);

CREATE TABLE IF NOT EXISTS payments (
    id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id            UUID        NOT NULL REFERENCES invoices(id),
    patient_id            UUID        NOT NULL REFERENCES patients(id),
    payment_number        VARCHAR(30) NOT NULL UNIQUE,
    amount                NUMERIC(12,2) NOT NULL,
    payment_method        VARCHAR(20) NOT NULL,
    transaction_reference VARCHAR(200),
    paid_at               TIMESTAMP   NOT NULL,
    processed_by          UUID,
    notes                 TEXT,
    created_at            TIMESTAMP   NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMP
);

CREATE INDEX idx_payments_invoice ON payments(invoice_id);
CREATE INDEX idx_payments_patient ON payments(patient_id);

CREATE TABLE IF NOT EXISTS insurance_claims (
    id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id           UUID        NOT NULL REFERENCES invoices(id),
    insurance_policy_id  UUID        NOT NULL REFERENCES insurance_policies(id),
    claim_number         VARCHAR(50) NOT NULL UNIQUE,
    status               VARCHAR(25) NOT NULL DEFAULT 'DRAFT',
    claimed_amount       NUMERIC(12,2) NOT NULL,
    approved_amount      NUMERIC(12,2),
    rejected_amount      NUMERIC(12,2),
    submitted_at         TIMESTAMP,
    processed_at         TIMESTAMP,
    rejection_reason     TEXT,
    notes                TEXT,
    created_at           TIMESTAMP   NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMP
);

CREATE INDEX idx_claims_invoice ON insurance_claims(invoice_id);
CREATE INDEX idx_claims_status  ON insurance_claims(status);
