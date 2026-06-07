INSERT INTO system_settings (key, value) VALUES ('businessHoursStart', '09:00') ON CONFLICT (key) DO NOTHING;
INSERT INTO system_settings (key, value) VALUES ('businessHoursEnd', '17:00') ON CONFLICT (key) DO NOTHING;
INSERT INTO system_settings (key, value) VALUES ('businessDays', '1,2,3,4,5') ON CONFLICT (key) DO NOTHING;
INSERT INTO system_settings (key, value) VALUES ('businessTimezone', 'UTC') ON CONFLICT (key) DO NOTHING;
