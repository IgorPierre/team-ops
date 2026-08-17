-- +goose Up
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    number INTEGER NOT NULL,
    organization_id UUID NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    acceptance_criteria TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'backlog',
    priority TEXT NOT NULL DEFAULT 'medium',
    assignee_id UUID REFERENCES users (id) ON DELETE SET NULL,
    reporter_id UUID REFERENCES users (id) ON DELETE SET NULL,
    due_date DATE,
    position NUMERIC(20, 10) NOT NULL DEFAULT 1000,
    blocked BOOLEAN NOT NULL DEFAULT FALSE,
    blocked_reason TEXT,
    source TEXT NOT NULL DEFAULT 'manual',
    external_ref TEXT,
    source_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    completion_summary TEXT,
    version INTEGER NOT NULL DEFAULT 1,
    archived_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT tasks_status_check CHECK (status IN ('backlog', 'in_progress', 'review', 'done')),
    CONSTRAINT tasks_priority_check CHECK (priority IN ('low', 'medium', 'high')),
    CONSTRAINT tasks_source_check CHECK (source IN ('manual', 'ai', 'integration')),
    CONSTRAINT tasks_project_number_unique UNIQUE (project_id, number)
);

CREATE UNIQUE INDEX tasks_project_external_ref_unique
    ON tasks (project_id, external_ref)
    WHERE external_ref IS NOT NULL AND external_ref <> '';

CREATE INDEX tasks_org_status_position_idx ON tasks (organization_id, status, position)
    WHERE archived_at IS NULL;
CREATE INDEX tasks_project_status_idx ON tasks (project_id, status)
    WHERE archived_at IS NULL;
CREATE INDEX tasks_assignee_idx ON tasks (assignee_id)
    WHERE archived_at IS NULL;
CREATE INDEX tasks_updated_at_idx ON tasks (updated_at DESC);

-- +goose Down
DROP TABLE IF EXISTS tasks;
