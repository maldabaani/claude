CREATE TABLE sla_escalation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  priority VARCHAR(20) NOT NULL,
  threshold_percent INT NOT NULL DEFAULT 80,
  action VARCHAR(20) NOT NULL CHECK (action IN ('NOTIFY_AGENT','NOTIFY_ADMIN','REASSIGN_ADMIN')),
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);
INSERT INTO sla_escalation_rules (name, priority, threshold_percent, action) VALUES
  ('Critical 80%', 'CRITICAL', 80, 'NOTIFY_AGENT'),
  ('Critical 100%', 'CRITICAL', 100, 'NOTIFY_ADMIN'),
  ('High 80%', 'HIGH', 80, 'NOTIFY_AGENT'),
  ('High 100%', 'HIGH', 100, 'NOTIFY_ADMIN');
