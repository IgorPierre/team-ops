-- name: CreateOAuthClient :one
INSERT INTO oauth_clients (client_id, client_name, redirect_uris)
VALUES ($1, $2, $3)
RETURNING *;

-- name: GetOAuthClient :one
SELECT * FROM oauth_clients WHERE client_id = $1;

-- name: FindAgentForOAuth :one
SELECT * FROM agents
WHERE organization_id = sqlc.arg('organization_id')
  AND developer_id = sqlc.arg('developer_id')
  AND name = sqlc.arg('name')
ORDER BY created_at
LIMIT 1;

-- name: CreateOAuthCode :exec
INSERT INTO oauth_codes (code_hash, client_id, agent_id, redirect_uri, code_challenge, resource, expires_at)
VALUES ($1, $2, $3, $4, $5, $6, $7);

-- name: ConsumeOAuthCode :one
-- Single use: the first exchange marks it used; replays get no row.
UPDATE oauth_codes
SET used_at = now()
WHERE code_hash = $1 AND used_at IS NULL AND expires_at > now()
RETURNING *;

-- name: CreateOAuthToken :one
INSERT INTO oauth_tokens (token_hash, kind, client_id, agent_id, expires_at)
VALUES ($1, $2, $3, $4, $5)
RETURNING *;

-- name: GetActiveOAuthToken :one
SELECT * FROM oauth_tokens
WHERE token_hash = $1 AND kind = $2 AND revoked_at IS NULL AND expires_at > now();

-- name: RevokeOAuthToken :execrows
UPDATE oauth_tokens SET revoked_at = now()
WHERE token_hash = $1 AND revoked_at IS NULL;

-- name: RevokeAgentOAuthTokens :exec
UPDATE oauth_tokens SET revoked_at = now()
WHERE agent_id = $1 AND revoked_at IS NULL;

-- name: ListConnectedClientsByOrganization :many
-- Which agents currently have a live OAuth connection, and through which app.
SELECT DISTINCT ON (t.agent_id) t.agent_id, c.client_name, t.created_at
FROM oauth_tokens t
JOIN oauth_clients c ON c.client_id = t.client_id
JOIN agents a ON a.id = t.agent_id
WHERE a.organization_id = $1 AND t.kind = 'refresh' AND t.revoked_at IS NULL AND t.expires_at > now()
ORDER BY t.agent_id, t.created_at DESC;
