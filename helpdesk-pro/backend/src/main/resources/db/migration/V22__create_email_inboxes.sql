CREATE TABLE email_inboxes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  host VARCHAR(255) NOT NULL,
  port INT DEFAULT 993,
  username VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL,
  protocol VARCHAR(10) DEFAULT 'IMAP',
  use_ssl BOOLEAN DEFAULT TRUE,
  default_department_id UUID REFERENCES departments(id),
  default_priority VARCHAR(20) DEFAULT 'MEDIUM',
  active BOOLEAN DEFAULT TRUE,
  last_checked_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
