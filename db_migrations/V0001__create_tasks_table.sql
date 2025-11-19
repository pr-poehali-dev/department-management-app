CREATE TABLE IF NOT EXISTS tasks (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    priority VARCHAR(20) NOT NULL DEFAULT 'medium',
    assignee VARCHAR(100) NOT NULL,
    due_date TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT status_check CHECK (status IN ('completed', 'in-progress', 'pending', 'overdue')),
    CONSTRAINT priority_check CHECK (priority IN ('high', 'medium', 'low'))
);

CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_priority ON tasks(priority);

INSERT INTO tasks (title, description, status, priority, assignee, due_date, created_at) VALUES
('Подготовить квартальный отчет', 'Составить финансовый отчет за Q4', 'completed', 'high', 'Иванов А.С.', '2024-11-15 23:59:59', '2024-11-01 09:00:00'),
('Провести аудит системы безопасности', 'Проверить все точки доступа и протоколы', 'in-progress', 'high', 'Петрова М.В.', '2024-11-25 23:59:59', '2024-11-10 10:00:00'),
('Обновить базу данных клиентов', 'Актуализировать контактную информацию', 'pending', 'medium', 'Сидоров П.К.', '2024-11-30 23:59:59', '2024-11-12 11:00:00'),
('Разработать маркетинговую стратегию', 'План продвижения на 2025 год', 'overdue', 'high', 'Козлова Е.А.', '2024-11-18 23:59:59', '2024-11-05 14:00:00'),
('Организовать тренинг для сотрудников', 'Обучение новым стандартам работы', 'pending', 'low', 'Морозов Д.И.', '2024-12-05 23:59:59', '2024-11-15 15:00:00'),
('Закупка оборудования', 'Новые компьютеры для отдела разработки', 'completed', 'medium', 'Соколова Н.П.', '2024-11-20 23:59:59', '2024-11-08 16:00:00');