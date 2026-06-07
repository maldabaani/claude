CREATE TABLE system_settings (
    key         VARCHAR(100) PRIMARY KEY,
    value       TEXT,
    updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO system_settings (key, value) VALUES
    ('company_name',                    'HelpDesk Pro'),
    ('support_email',                   'support@helpdesk.com'),
    ('notify_ticket_created',           'true'),
    ('notify_comment_added',            'true'),
    ('notify_status_changed',           'true'),
    ('notify_ticket_assigned',          'true'),
    ('notify_sla_breached',             'true');
