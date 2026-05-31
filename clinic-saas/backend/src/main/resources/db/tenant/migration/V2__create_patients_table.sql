CREATE TABLE IF NOT EXISTS patients (
    id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    mrn                     VARCHAR(20) NOT NULL UNIQUE,
    first_name              VARCHAR(100) NOT NULL,
    last_name               VARCHAR(100) NOT NULL,
    date_of_birth           DATE         NOT NULL,
    gender                  VARCHAR(10)  NOT NULL,
    phone                   VARCHAR(30),
    email                   VARCHAR(255),
    address_line1           VARCHAR(255),
    city                    VARCHAR(100),
    country                 VARCHAR(100),
    emergency_contact_name  VARCHAR(200),
    emergency_contact_phone VARCHAR(30),
    blood_type              VARCHAR(15),
    allergies               TEXT,
    active                  BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at              TIMESTAMP   NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP
);

CREATE INDEX idx_patients_mrn       ON patients (mrn);
CREATE INDEX idx_patients_last_name ON patients (last_name);
CREATE INDEX idx_patients_active    ON patients (active);
