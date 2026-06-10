-- The original seed hashes in V6 did not match the documented passwords
-- (they were copied placeholder hashes). Reset the seed users to BCrypt
-- (strength 10) hashes that match the credentials documented in V6:
--   Admin:    Admin@123
--   Agent:    Agent@123
--   Customer: Customer@123

UPDATE users SET password_hash = '$2a$10$HUznbMdLLmNUBRkQTRGN9uTnplZ5Ufk.FIz5kl6Idw4BerjB69jTC'
WHERE email = 'admin@helpdesk.com';

UPDATE users SET password_hash = '$2a$10$rlGZ0mnFsqLOUJoLWSEdiONWW0eFDDjWL1xoZHcN9EaleaD0s3Beu'
WHERE email = 'agent@helpdesk.com';

UPDATE users SET password_hash = '$2a$10$L/oonEY5o/dnGZnkuuNUaeYSdJGXAbBbKl5d2E62YOfKElh553drO'
WHERE email = 'customer@helpdesk.com';
