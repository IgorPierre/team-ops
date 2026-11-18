-- +goose Up
ALTER TABLE tasks DROP CONSTRAINT tasks_status_check;
ALTER TABLE tasks ADD CONSTRAINT tasks_status_check CHECK (status IN ('backlog', 'in_progress', 'review', 'done', 'production'));

-- +goose Down
UPDATE tasks SET status = 'done' WHERE status = 'production';
ALTER TABLE tasks DROP CONSTRAINT tasks_status_check;
ALTER TABLE tasks ADD CONSTRAINT tasks_status_check CHECK (status IN ('backlog', 'in_progress', 'review', 'done'));
