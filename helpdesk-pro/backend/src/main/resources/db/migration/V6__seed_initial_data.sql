-- Departments
INSERT INTO departments (id, name, description, inbound_email, active)
VALUES
    ('a1000000-0000-0000-0000-000000000001', 'IT Support', 'Technical support and infrastructure', 'it@helpdesk.com', true),
    ('a1000000-0000-0000-0000-000000000002', 'Billing', 'Billing and payment inquiries', 'billing@helpdesk.com', true),
    ('a1000000-0000-0000-0000-000000000003', 'General', 'General inquiries', 'support@helpdesk.com', true);

-- SLA Policies
INSERT INTO sla_policies (id, name, response_time_hours, resolution_time_hours, priority, business_hours_only)
VALUES
    ('b1000000-0000-0000-0000-000000000001', 'Critical SLA', 1, 4, 'CRITICAL', false),
    ('b1000000-0000-0000-0000-000000000002', 'High Priority SLA', 4, 8, 'HIGH', false),
    ('b1000000-0000-0000-0000-000000000003', 'Standard SLA', 8, 24, 'MEDIUM', true),
    ('b1000000-0000-0000-0000-000000000004', 'Low Priority SLA', 24, 72, 'LOW', true);

-- Seed users (passwords are BCrypt hashed)
-- Admin: Admin@123
-- Agent: Agent@123
-- Customer: Customer@123
INSERT INTO users (id, full_name, email, password_hash, role, department_id, active)
VALUES
    ('c1000000-0000-0000-0000-000000000001', 'System Admin', 'admin@helpdesk.com',
     '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', 'ADMIN', NULL, true),
    ('c1000000-0000-0000-0000-000000000002', 'IT Agent', 'agent@helpdesk.com',
     '$2a$10$8K1p/a0dR1xqM8K3Qb1MhuYkZGbXHjKT.bssFL/gOFbMUxJvkTJmy', 'AGENT',
     'a1000000-0000-0000-0000-000000000001', true),
    ('c1000000-0000-0000-0000-000000000003', 'Jane Customer', 'customer@helpdesk.com',
     '$2a$10$sCe6J5y8mI5RxBx.5eNXsuM3G.G5kLCcxMEJvPzfM1r6EXE1mhSoa', 'CUSTOMER', NULL, true);
