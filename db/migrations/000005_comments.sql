-- +goose Up
CREATE TABLE task_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks (id) ON DELETE CASCADE,
    author_type TEXT NOT NULL,
    author_id UUID,
    content TEXT NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT task_comments_author_type_check CHECK (author_type IN ('user', 'agent', 'system'))
);

CREATE INDEX task_comments_task_id_idx ON task_comments (task_id, created_at);

-- +goose Down
DROP TABLE IF EXISTS task_comments;
