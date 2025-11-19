CREATE TABLE IF NOT EXISTS employee_groups (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS employees (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    position VARCHAR(100),
    group_id INTEGER REFERENCES employee_groups(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_employees_group_id ON employees(group_id);
CREATE INDEX idx_employees_full_name ON employees(full_name);

INSERT INTO employee_groups (name, description) VALUES
('Финансовый отдел', 'Отдел бухгалтерии и финансового планирования'),
('Отдел безопасности', 'IT-безопасность и защита информации'),
('Отдел разработки', 'Разработка и поддержка программного обеспечения'),
('Маркетинг', 'Маркетинг и продвижение'),
('HR отдел', 'Управление персоналом');

INSERT INTO employees (full_name, email, position, group_id) VALUES
('Иванов А.С.', 'ivanov@company.com', 'Старший бухгалтер', 1),
('Петрова М.В.', 'petrova@company.com', 'Специалист по безопасности', 2),
('Сидоров П.К.', 'sidorov@company.com', 'Системный администратор', 3),
('Козлова Е.А.', 'kozlova@company.com', 'Менеджер по маркетингу', 4),
('Морозов Д.И.', 'morozov@company.com', 'HR-менеджер', 5),
('Соколова Н.П.', 'sokolova@company.com', 'Закупщик', 3);

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS employee_id INTEGER REFERENCES employees(id);

UPDATE tasks t SET employee_id = e.id FROM employees e WHERE t.assignee = e.full_name;