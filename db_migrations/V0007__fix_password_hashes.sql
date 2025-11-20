-- Update all password hashes to SHA256 format for 'admin123'
-- SHA256 hash of 'admin123' is: 240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9

UPDATE users 
SET password_hash = '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9'
WHERE username IN ('admin', 'ivanov', 'petrova');

COMMENT ON TABLE users IS 'Users table with SHA256 password hashing. All passwords are "admin123" for testing.';