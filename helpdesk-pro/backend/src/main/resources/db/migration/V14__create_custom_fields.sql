CREATE TABLE custom_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  field_key VARCHAR(50) NOT NULL UNIQUE,
  field_type VARCHAR(20) NOT NULL CHECK (field_type IN ('TEXT','DROPDOWN','DATE','CHECKBOX')),
  options TEXT, -- JSON array for DROPDOWN
  required BOOLEAN DEFAULT FALSE,
  display_order INT DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE TABLE ticket_custom_values (
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  field_key VARCHAR(50) NOT NULL REFERENCES custom_fields(field_key) ON DELETE CASCADE,
  value TEXT,
  PRIMARY KEY (ticket_id, field_key)
);
