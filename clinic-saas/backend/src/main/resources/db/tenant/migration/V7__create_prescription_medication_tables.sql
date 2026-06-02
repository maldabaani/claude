CREATE TABLE IF NOT EXISTS medications (
    id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    generic_name            VARCHAR(200) NOT NULL,
    brand_name              VARCHAR(200),
    drug_class              VARCHAR(100),
    atc_code                VARCHAR(20),
    form                    VARCHAR(20),
    strength                VARCHAR(50),
    manufacturer            VARCHAR(200),
    is_controlled           BOOLEAN     NOT NULL DEFAULT FALSE,
    requires_prescription   BOOLEAN     NOT NULL DEFAULT TRUE,
    active                  BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at              TIMESTAMP   NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP
);

CREATE INDEX idx_medications_generic ON medications(generic_name);
CREATE INDEX idx_medications_atc     ON medications(atc_code);

CREATE TABLE IF NOT EXISTS prescriptions (
    id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    visit_id             UUID        NOT NULL REFERENCES visits(id),
    patient_id           UUID        NOT NULL REFERENCES patients(id),
    prescribed_by        UUID        NOT NULL REFERENCES users(id),
    prescription_number  VARCHAR(30) NOT NULL UNIQUE,
    status               VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    valid_until          DATE,
    dispensed_at         TIMESTAMP,
    notes                TEXT,
    created_at           TIMESTAMP   NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMP
);

CREATE INDEX idx_prescriptions_visit   ON prescriptions(visit_id);
CREATE INDEX idx_prescriptions_patient ON prescriptions(patient_id);
CREATE INDEX idx_prescriptions_status  ON prescriptions(status);

CREATE TABLE IF NOT EXISTS prescription_items (
    id                        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    prescription_id           UUID        NOT NULL REFERENCES prescriptions(id),
    medication_id             UUID        REFERENCES medications(id),
    medication_name_snapshot  VARCHAR(200) NOT NULL,
    dosage                    VARCHAR(100) NOT NULL,
    frequency                 VARCHAR(30) NOT NULL,
    frequency_details         VARCHAR(200),
    route                     VARCHAR(20) NOT NULL DEFAULT 'ORAL',
    duration_days             INT,
    quantity                  INT,
    is_substitution_allowed   BOOLEAN     NOT NULL DEFAULT FALSE,
    instructions              TEXT,
    created_at                TIMESTAMP   NOT NULL DEFAULT NOW(),
    updated_at                TIMESTAMP
);

CREATE INDEX idx_rx_items_prescription ON prescription_items(prescription_id);
