CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'user',
    employee_id INTEGER REFERENCES employees(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    last_login TIMESTAMP,
    CONSTRAINT role_check CHECK (role IN ('admin', 'manager', 'user'))
);

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_employee_id ON users(employee_id);

INSERT INTO users (username, password_hash, full_name, role, employee_id) VALUES
('admin', '$2b$10$rRKvFqGhEWJZqMQZXJZ0OOuPxKKYH6XQYJlYqYQYQYQYQYQYQYQYQ', 'Администратор', 'admin', NULL),
('ivanov', '$2b$10$rRKvFqGhEWJZqMQZXJZ0OOuPxKKYH6XQYJlYqYQYQYQYQYQYQYQYQ', 'Иванов А.С.', 'manager', 1),
('petrova', '$2b$10$rRKvFqGhEWJZqMQZXJZ0OOuPxKKYH6XQYJlYqYQYQYQYQYQYQYQYQ', 'Петрова М.В.', 'user', 2);