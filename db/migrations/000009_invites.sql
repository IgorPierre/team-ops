-- +goose Up
CREATE TABLE organization_invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
    email TEXT,
    role TEXT NOT NULL,
    token_hash TEXT NOT NULL,
    created_by UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL,
    accepted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT organization_invites_role_check CHECK (role IN ('admin', 'developer', 'viewer')),
    CONSTRAINT organization_invites_token_hash_key UNIQUE (token_hash)
);

CREATE INDEX organization_invites_org_pending_idx
    ON organization_invites (organization_id)
    WHERE accepted_at IS NULL;

-- +goose Down
DROP TABLE IF EXISTS organization_invites;
