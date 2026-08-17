-- +goose Up
CREATE TABLE agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    developer_id UUID REFERENCES users (id) ON DELETE SET NULL,
    organization_id UUID REFERENCES organizations (id) ON DELETE CASCADE,
    description TEXT,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    last_seen_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX agents_organization_id_idx ON agents (organization_id);
CREATE INDEX agents_developer_id_idx ON agents (developer_id);

-- +goose Down
DROP TABLE IF EXISTS agents;
