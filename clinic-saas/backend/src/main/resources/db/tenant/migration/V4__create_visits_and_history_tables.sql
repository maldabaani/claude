-- Expand patients with additional demographic fields
ALTER TABLE patients
    ADD COLUMN IF NOT EXISTS national_id        VARCHAR(50),
    ADD COLUMN IF NOT EXISTS passport_number    VARCHAR(50),
    ADD COLUMN IF NOT EXISTS nationality        VARCHAR(100),
    ADD COLUMN IF NOT EXISTS occupation         VARCHAR(200),
    ADD COLUMN IF NOT EXISTS address_line2      VARCHAR(255),
    ADD COLUMN IF NOT EXISTS emergency_contact_relation VARCHAR(50),
    ADD COLUMN IF NOT EXISTS profile_photo_url  VARCHAR(500);

-- Link appointments to visits
ALTER TABLE appointments
    ADD COLUMN IF NOT EXISTS visit_id           UUID,
    ADD COLUMN IF NOT EXISTS checked_in_at      TIMESTAMP,
    ADD COLUMN IF NOT EXISTS confirmation_code  VARCHAR(20);

CREATE TABLE IF NOT EXISTS visits (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id      UUID        NOT NULL REFERENCES patients(id),
    doctor_id       UUID        NOT NULL REFERENCES users(id),
    appointment_id  UUID        REFERENCES appointments(id),
    visit_type      VARCHAR(20) NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'WAITING',
    chief_complaint TEXT,
    clinical_notes  TEXT,
    checked_in_at   TIMESTAMP,
    checked_out_at  TIMESTAMP,
    created_at      TIMESTAMP   NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP
);

CREATE INDEX idx_visits_patient   ON visits(patient_id);
CREATE INDEX idx_visits_doctor    ON visits(doctor_id);
CREATE INDEX idx_visits_status    ON visits(status);
CREATE INDEX idx_visits_created   ON visits(created_at);

CREATE TABLE IF NOT EXISTS vital_signs (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visit_id            UUID NOT NULL REFERENCES visits(id),
    recorded_by         UUID REFERENCES users(id),
    bp_systolic         INT,
    bp_diastolic        INT,
    heart_rate          INT,
    respiratory_rate    INT,
    temperature         NUMERIC(4,1),
    oxygen_saturation   NUMERIC(4,1),
    weight_kg           NUMERIC(5,2),
    height_cm           NUMERIC(5,1),
    bmi                 NUMERIC(4,1),
    blood_glucose       NUMERIC(5,1),
    notes               TEXT,
    created_at          TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP
);

CREATE INDEX idx_vitals_visit ON vital_signs(visit_id);

CREATE TABLE IF NOT EXISTS diagnoses (
    id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    visit_id             UUID        NOT NULL REFERENCES visits(id),
    patient_id           UUID        NOT NULL REFERENCES patients(id),
    diagnosed_by         UUID        NOT NULL REFERENCES users(id),
    diagnosis_type       VARCHAR(20) NOT NULL DEFAULT 'PRIMARY',
    icd_code             VARCHAR(20),
    icd_description      VARCHAR(500),
    clinical_description TEXT,
    is_chronic           BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at           TIMESTAMP   NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMP
);

CREATE INDEX idx_diagnoses_visit   ON diagnoses(visit_id);
CREATE INDEX idx_diagnoses_patient ON diagnoses(patient_id);
CREATE INDEX idx_diagnoses_icd     ON diagnoses(icd_code);

CREATE TABLE IF NOT EXISTS allergies (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id    UUID        NOT NULL REFERENCES patients(id),
    allergen_type VARCHAR(20) NOT NULL,
    allergen_name VARCHAR(200) NOT NULL,
    reaction      VARCHAR(500),
    severity      VARCHAR(20),
    onset_date    DATE,
    notes         TEXT,
    active        BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMP   NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMP
);

CREATE INDEX idx_allergies_patient ON allergies(patient_id);
CREATE INDEX idx_allergies_active  ON allergies(patient_id, active);

CREATE TABLE IF NOT EXISTS medical_history (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id          UUID        NOT NULL REFERENCES patients(id),
    history_type        VARCHAR(30) NOT NULL,
    condition_name      VARCHAR(300) NOT NULL,
    icd_code            VARCHAR(20),
    status              VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    onset_date          DATE,
    resolved_date       DATE,
    treating_physician  VARCHAR(200),
    notes               TEXT,
    created_at          TIMESTAMP   NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP
);

CREATE INDEX idx_med_history_patient ON medical_history(patient_id);
CREATE INDEX idx_med_history_type    ON medical_history(patient_id, history_type);
