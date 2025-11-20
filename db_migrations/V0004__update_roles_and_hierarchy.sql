-- Сначала обновляем существующих пользователей на новые роли
UPDATE users SET role = 'department_head' WHERE username = 'admin';
UPDATE users SET role = 'group_head' WHERE username = 'ivanov';
UPDATE users SET role = 'employee' WHERE username = 'petrova';

-- Теперь обновляем constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS role_check;
ALTER TABLE users ADD CONSTRAINT role_check CHECK (role IN ('department_head', 'group_head', 'employee'));

-- Добавляем поле manager_id в employee_groups для привязки начальника группы
ALTER TABLE employee_groups ADD COLUMN IF NOT EXISTS manager_id INTEGER REFERENCES employees(id);

-- Привязываем начальников к группам
UPDATE employee_groups SET manager_id = 1 WHERE name = 'Финансовый отдел';
UPDATE employee_groups SET manager_id = 3 WHERE name = 'Отдел разработки';

-- Добавляем еще одного начальника группы
INSERT INTO users (username, password_hash, full_name, role, employee_id) VALUES
('sidorov', '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', 'Сидоров П.К.', 'group_head', 3);

-- Создаем индекс для быстрого поиска начальников групп
CREATE INDEX IF NOT EXISTS idx_employee_groups_manager_id ON employee_groups(manager_id);