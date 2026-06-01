CREATE TABLE IF NOT EXISTS radiology_orders (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    visit_id            UUID        NOT NULL REFERENCES visits(id),
    patient_id          UUID        NOT NULL REFERENCES patients(id),
    ordered_by          UUID        NOT NULL REFERENCES users(id),
    order_number        VARCHAR(30) NOT NULL UNIQUE,
    modality            VARCHAR(25) NOT NULL,
    body_part           VARCHAR(100),
    laterality          VARCHAR(10),
    clinical_indication TEXT,
    status              VARCHAR(20) NOT NULL DEFAULT 'ORDERED',
    priority            VARCHAR(15) NOT NULL DEFAULT 'ROUTINE',
    scheduled_at        TIMESTAMP,
    performed_at        TIMESTAMP,
    notes               TEXT,
    created_at          TIMESTAMP   NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP
);

CREATE INDEX idx_rad_orders_visit   ON radiology_orders(visit_id);
CREATE INDEX idx_rad_orders_patient ON radiology_orders(patient_id);
CREATE INDEX idx_rad_orders_status  ON radiology_orders(status);

CREATE TABLE IF NOT EXISTS radiology_studies (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    radiology_order_id  UUID        NOT NULL UNIQUE REFERENCES radiology_orders(id),
    accession_number    VARCHAR(50) UNIQUE,
    study_instance_uid  VARCHAR(100) UNIQUE,
    performed_by        UUID,
    number_of_images    INT,
    image_storage_path  VARCHAR(500),
    performed_at        TIMESTAMP,
    notes               TEXT,
    created_at          TIMESTAMP   NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP
);

CREATE TABLE IF NOT EXISTS radiology_reports (
    id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    radiology_study_id    UUID        NOT NULL UNIQUE REFERENCES radiology_studies(id),
    reported_by           UUID        NOT NULL,
    findings              TEXT,
    impression            TEXT,
    recommendation        TEXT,
    status                VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    reported_at           TIMESTAMP,
    amended_at            TIMESTAMP,
    amendment_reason      TEXT,
    created_at            TIMESTAMP   NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMP
);

CREATE INDEX idx_rad_reports_status ON radiology_reports(status);
