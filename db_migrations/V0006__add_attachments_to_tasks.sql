-- Добавляем поле для хранения вложений в JSON формате
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb;

-- Создаем индекс для быстрого поиска по вложениям
CREATE INDEX IF NOT EXISTS idx_tasks_attachments ON tasks USING gin(attachments);

-- Добавляем комментарий для документации
COMMENT ON COLUMN tasks.attachments IS 'Array of file attachments with structure: [{name, url, size, uploadedAt}]';