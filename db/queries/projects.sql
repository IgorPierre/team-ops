-- name: CreateProject :one
INSERT INTO projects (organization_id, name, key, description)
VALUES ($1, $2, $3, $4)
RETURNING *;

-- name: GetProject :one
SELECT * FROM projects WHERE id = $1;

-- name: GetProjectByOrgAndKey :one
SELECT * FROM projects
WHERE organization_id = $1 AND key = $2;

-- name: ListProjectsByOrganization :many
SELECT * FROM projects
WHERE organization_id = $1
  AND active = TRUE
ORDER BY name;

-- name: UpdateProject :one
UPDATE projects
SET
    name = COALESCE(sqlc.narg('name'), name),
    description = COALESCE(sqlc.narg('description'), description),
    updated_at = now()
WHERE id = $1
RETURNING *;

-- name: IncrementProjectTaskCounter :one
UPDATE projects
SET task_counter = task_counter + 1, updated_at = now()
WHERE id = $1
RETURNING task_counter;
