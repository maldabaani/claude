CREATE TABLE ticket_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  subject VARCHAR(255),
  description TEXT,
  priority VARCHAR(20) DEFAULT 'MEDIUM',
  category VARCHAR(100),
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);
INSERT INTO ticket_templates (name, subject, description, priority, category) VALUES
  ('Password Reset', 'Password Reset Request', 'I need to reset my password for...', 'LOW', 'Account'),
  ('Software Installation', 'Software Installation Request', 'I need the following software installed...', 'MEDIUM', 'Software'),
  ('Hardware Issue', 'Hardware Problem Report', 'I am experiencing the following hardware issue...', 'HIGH', 'Hardware'),
  ('VPN Access', 'VPN Access Request', 'I require VPN access for...', 'MEDIUM', 'Access');
