CREATE TABLE business_hours (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    day_of_week INT NOT NULL, -- 1=Mon, 7=Sun
    is_open BOOLEAN NOT NULL DEFAULT true,
    open_time TIME,
    close_time TIME,
    timezone VARCHAR(100) NOT NULL DEFAULT 'UTC'
);

CREATE TABLE business_holidays (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    holiday_date DATE NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Seed default Mon-Fri 9-5 UTC
INSERT INTO business_hours (day_of_week, is_open, open_time, close_time, timezone) VALUES
(1, true, '09:00', '17:00', 'UTC'),
(2, true, '09:00', '17:00', 'UTC'),
(3, true, '09:00', '17:00', 'UTC'),
(4, true, '09:00', '17:00', 'UTC'),
(5, true, '09:00', '17:00', 'UTC'),
(6, false, null, null, 'UTC'),
(7, false, null, null, 'UTC');
