CREATE TABLE help_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  department_id UUID REFERENCES departments(id),
  default_priority VARCHAR(20) DEFAULT 'MEDIUM',
  auto_assign_team_lead BOOLEAN DEFAULT FALSE,
  active BOOLEAN DEFAULT TRUE,
  display_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);
INSERT INTO help_topics (name, description, default_priority, display_order) VALUES
  ('General Inquiry', 'General questions and information requests', 'LOW', 1),
  ('Technical Support', 'Hardware, software, and connectivity issues', 'HIGH', 2),
  ('Billing & Accounts', 'Billing questions and account management', 'MEDIUM', 3),
  ('Feature Request', 'Suggestions for new features or improvements', 'LOW', 4),
  ('Bug Report', 'Report a problem or unexpected behavior', 'HIGH', 5);
