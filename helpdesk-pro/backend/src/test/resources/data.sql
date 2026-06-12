-- Seed test users for integration tests (passwords from V29 migration)
-- Admin@123, Agent@123, Customer@123
INSERT INTO users (id, full_name, email, password_hash, role, active, totp_enabled, availability_status, created_at, updated_at)
VALUES
    ('c1000000-0000-0000-0000-000000000001', 'System Admin', 'admin@helpdesk.com',
     '$2a$10$HUznbMdLLmNUBRkQTRGN9uTnplZ5Ufk.FIz5kl6Idw4BerjB69jTC', 'ADMIN', true, false, 'OFFLINE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('c1000000-0000-0000-0000-000000000002', 'IT Agent', 'agent@helpdesk.com',
     '$2a$10$rlGZ0mnFsqLOUJoLWSEdiONWW0eFDDjWL1xoZHcN9EaleaD0s3Beu', 'AGENT', true, false, 'OFFLINE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('c1000000-0000-0000-0000-000000000003', 'Jane Customer', 'customer@helpdesk.com',
     '$2a$10$L/oonEY5o/dnGZnkuuNUaeYSdJGXAbBbKl5d2E62YOfKElh553drO', 'CUSTOMER', true, false, 'OFFLINE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
