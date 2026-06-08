INSERT INTO system_settings (key, value) VALUES ('autoAssignTickets', 'false') ON CONFLICT (key) DO NOTHING;
