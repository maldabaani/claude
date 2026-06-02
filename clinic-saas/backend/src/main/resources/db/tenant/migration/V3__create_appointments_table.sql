CREATE TABLE IF NOT EXISTS appointments (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id          UUID        NOT NULL,
    doctor_id           UUID        NOT NULL,
    scheduled_at        TIMESTAMP   NOT NULL,
    duration_minutes    INT         NOT NULL DEFAULT 30,
    status              VARCHAR(20) NOT NULL DEFAULT 'SCHEDULED',
    appointment_type    VARCHAR(100),
    notes               TEXT,
    cancellation_reason VARCHAR(500),
    created_at          TIMESTAMP   NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP,

    CONSTRAINT fk_appointments_patient FOREIGN KEY (patient_id) REFERENCES patients (id),
    CONSTRAINT fk_appointments_doctor  FOREIGN KEY (doctor_id)  REFERENCES users (id),
    CONSTRAINT chk_status CHECK (status IN ('SCHEDULED','CONFIRMED','IN_PROGRESS','COMPLETED','CANCELLED','NO_SHOW'))
);

CREATE INDEX idx_appt_doctor_scheduled ON appointments (doctor_id, scheduled_at);
CREATE INDEX idx_appt_patient          ON appointments (patient_id);
CREATE INDEX idx_appt_status           ON appointments (status);
CREATE INDEX idx_appt_scheduled_at     ON appointments (scheduled_at);
