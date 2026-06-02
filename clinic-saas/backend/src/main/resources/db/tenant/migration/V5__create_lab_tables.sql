CREATE TABLE IF NOT EXISTS lab_tests (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    code                VARCHAR(50) NOT NULL UNIQUE,
    name                VARCHAR(200) NOT NULL,
    category            VARCHAR(100),
    unit                VARCHAR(50),
    normal_range_min    NUMERIC(10,3),
    normal_range_max    NUMERIC(10,3),
    normal_range_text   VARCHAR(200),
    turnaround_hours    INT,
    price               NUMERIC(10,2),
    active              BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMP   NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP
);

CREATE INDEX idx_lab_tests_code     ON lab_tests(code);
CREATE INDEX idx_lab_tests_category ON lab_tests(category);

CREATE TABLE IF NOT EXISTS lab_orders (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    visit_id            UUID        NOT NULL REFERENCES visits(id),
    patient_id          UUID        NOT NULL REFERENCES patients(id),
    ordered_by          UUID        NOT NULL REFERENCES users(id),
    order_number        VARCHAR(30) NOT NULL UNIQUE,
    status              VARCHAR(25) NOT NULL DEFAULT 'ORDERED',
    priority            VARCHAR(15) NOT NULL DEFAULT 'ROUTINE',
    clinical_indication TEXT,
    sample_collected_at TIMESTAMP,
    resulted_at         TIMESTAMP,
    notes               TEXT,
    created_at          TIMESTAMP   NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP
);

CREATE INDEX idx_lab_orders_visit   ON lab_orders(visit_id);
CREATE INDEX idx_lab_orders_patient ON lab_orders(patient_id);
CREATE INDEX idx_lab_orders_status  ON lab_orders(status);
CREATE INDEX idx_lab_orders_number  ON lab_orders(order_number);

CREATE TABLE IF NOT EXISTS lab_order_items (
    id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    lab_order_id          UUID        NOT NULL REFERENCES lab_orders(id),
    lab_test_id           UUID        NOT NULL REFERENCES lab_tests(id),
    status                VARCHAR(25) NOT NULL DEFAULT 'ORDERED',
    result_value          NUMERIC(15,4),
    result_text           TEXT,
    result_unit           VARCHAR(50),
    normal_range_snapshot VARCHAR(200),
    is_abnormal           BOOLEAN     NOT NULL DEFAULT FALSE,
    is_critical           BOOLEAN     NOT NULL DEFAULT FALSE,
    resulted_at           TIMESTAMP,
    resulted_by           UUID,
    notes                 TEXT,
    created_at            TIMESTAMP   NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMP
);

CREATE INDEX idx_lab_items_order    ON lab_order_items(lab_order_id);
CREATE INDEX idx_lab_items_abnormal ON lab_order_items(lab_order_id, is_abnormal);
