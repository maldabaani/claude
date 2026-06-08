CREATE TABLE IF NOT EXISTS clinic_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO clinic_settings (setting_key, setting_value) VALUES
  ('clinic_name', 'My Clinic'),
  ('clinic_phone', NULL),
  ('clinic_email', NULL),
  ('clinic_address', NULL),
  ('clinic_logo_url', NULL),
  ('timezone', 'Asia/Dubai'),
  ('currency', 'AED'),
  ('working_hours_start', '08:00'),
  ('working_hours_end', '17:00'),
  ('working_days', 'MON,TUE,WED,THU,FRI'),
  ('appointment_slot_minutes', '30'),
  ('consultation_fee', '150.00'),
  ('notifications_email_enabled', 'false'),
  ('notifications_smtp_host', NULL),
  ('notifications_smtp_port', '587'),
  ('notifications_smtp_user', NULL),
  ('notifications_smtp_pass', NULL),
  ('notifications_from_email', NULL)
ON CONFLICT (setting_key) DO NOTHING;
