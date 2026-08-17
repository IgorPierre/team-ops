-- +goose Up
CREATE TABLE task_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks (id) ON DELETE CASCADE,
    actor_type TEXT NOT NULL,
    actor_id UUID,
    action TEXT NOT NULL,
    old_value JSONB,
    new_value JSONB,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT task_activities_actor_type_check CHECK (actor_type IN ('user', 'agent', 'system'))
);

CREATE INDEX task_activities_task_id_idx ON task_activities (task_id, created_at DESC);

-- +goose Down
DROP TABLE IF EXISTS task_activities;
