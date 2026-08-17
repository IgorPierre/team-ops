-- name: CreateAgent :one
INSERT INTO agents (name, developer_id, organization_id, description)
VALUES ($1, $2, $3, $4)
RETURNING *;

-- name: GetAgent :one
SELECT * FROM agents WHERE id = $1;

-- name: ListAgentsByOrganization :many
SELECT * FROM agents
WHERE organization_id = $1
ORDER BY name;

-- name: UpdateAgent :one
UPDATE agents
SET
    name = COALESCE(sqlc.narg('name'), name),
    description = COALESCE(sqlc.narg('description'), description),
    active = COALESCE(sqlc.narg('active'), active),
    updated_at = now()
WHERE id = $1
RETURNING *;

-- name: TouchAgentLastSeen :exec
UPDATE agents SET last_seen_at = now(), updated_at = now() WHERE id = $1;

-- name: CreateAPIKey :one
INSERT INTO api_keys (agent_id, name, prefix, key_hash, scopes, expires_at)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING *;

-- name: GetAPIKeyByHash :one
SELECT * FROM api_keys
WHERE key_hash = $1
  AND revoked_at IS NULL
  AND (expires_at IS NULL OR expires_at > now());

-- name: ListAPIKeysByAgent :many
SELECT * FROM api_keys
WHERE agent_id = $1
ORDER BY created_at DESC;

-- name: RevokeAPIKey :one
UPDATE api_keys
SET revoked_at = now()
WHERE id = $1 AND revoked_at IS NULL
RETURNING *;

-- name: TouchAPIKeyLastUsed :exec
UPDATE api_keys SET last_used_at = now() WHERE id = $1;
