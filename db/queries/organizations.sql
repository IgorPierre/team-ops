-- name: CreateOrganization :one
INSERT INTO organizations (name, slug, color)
VALUES ($1, $2, $3)
RETURNING *;

-- name: GetOrganization :one
SELECT * FROM organizations WHERE id = $1;

-- name: GetOrganizationBySlug :one
SELECT * FROM organizations WHERE slug = $1;

-- name: ListOrganizationsForUser :many
SELECT o.*
FROM organizations o
JOIN organization_members m ON m.organization_id = o.id
WHERE m.user_id = $1
  AND o.active = TRUE
ORDER BY o.name;

-- name: UpdateOrganization :one
UPDATE organizations
SET
    name = COALESCE(sqlc.narg('name'), name),
    color = COALESCE(sqlc.narg('color'), color),
    updated_at = now()
WHERE id = $1
RETURNING *;

-- name: AddOrganizationMember :one
INSERT INTO organization_members (organization_id, user_id, role)
VALUES ($1, $2, $3)
RETURNING *;

-- name: GetOrganizationMember :one
SELECT * FROM organization_members
WHERE organization_id = $1 AND user_id = $2;

-- name: ListOrganizationMembers :many
SELECT
    m.organization_id,
    m.user_id,
    m.role,
    m.created_at,
    u.name AS user_name,
    u.email AS user_email,
    u.avatar_url AS user_avatar_url,
    u.active AS user_active
FROM organization_members m
JOIN users u ON u.id = m.user_id
WHERE m.organization_id = $1
ORDER BY u.name;

-- name: UpdateOrganizationMemberRole :one
UPDATE organization_members
SET role = $3
WHERE organization_id = $1 AND user_id = $2
RETURNING *;

-- name: RemoveOrganizationMember :exec
DELETE FROM organization_members
WHERE organization_id = $1 AND user_id = $2;

-- name: CountMembershipsForUser :one
SELECT count(*)::bigint FROM organization_members WHERE user_id = $1;

-- name: CountAdminMembershipsForUser :one
SELECT count(*)::bigint
FROM organization_members
WHERE user_id = $1 AND role = 'admin';

-- name: CreateOrganizationInvite :one
INSERT INTO organization_invites (organization_id, email, role, token_hash, created_by, expires_at)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING *;

-- name: GetPendingInviteByTokenHash :one
SELECT
    i.id,
    i.organization_id,
    i.email,
    i.role,
    i.token_hash,
    i.created_by,
    i.expires_at,
    i.accepted_at,
    i.created_at,
    o.name AS organization_name
FROM organization_invites i
JOIN organizations o ON o.id = i.organization_id
WHERE i.token_hash = $1
  AND i.accepted_at IS NULL
  AND i.expires_at > now();

-- name: ListPendingInvites :many
SELECT *
FROM organization_invites
WHERE organization_id = $1
  AND accepted_at IS NULL
  AND expires_at > now()
ORDER BY created_at DESC;

-- name: AcceptInvite :one
UPDATE organization_invites
SET accepted_at = now()
WHERE id = $1
  AND accepted_at IS NULL
RETURNING *;

-- name: DeleteInvite :exec
DELETE FROM organization_invites
WHERE id = $1 AND organization_id = $2 AND accepted_at IS NULL;
