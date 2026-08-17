-- +goose Up
CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES agents (id) ON DELETE CASCADE,
    name TEXT NOT NULL DEFAULT 'default',
    prefix TEXT NOT NULL,
    key_hash TEXT NOT NULL UNIQUE,
    scopes TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    expires_at TIMESTAMPTZ,
    last_used_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX api_keys_agent_id_idx ON api_keys (agent_id);
CREATE INDEX api_keys_prefix_idx ON api_keys (prefix);

-- +goose Down
DROP TABLE IF EXISTS api_keys;
