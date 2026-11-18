-- name: CreateComment :one
INSERT INTO task_comments (task_id, author_type, author_id, content, metadata)
VALUES ($1, $2, $3, $4, $5)
RETURNING *;

-- name: ListCommentsByTask :many
SELECT * FROM task_comments
WHERE task_id = $1
ORDER BY created_at ASC;

-- name: CreateActivity :one
INSERT INTO task_activities (task_id, actor_type, actor_id, action, old_value, new_value, metadata)
VALUES ($1, $2, $3, $4, $5, $6, $7)
RETURNING *;

-- name: ListActivitiesByTask :many
SELECT * FROM task_activities
WHERE task_id = $1
ORDER BY created_at DESC;

-- name: ListOrganizationActivities :many
SELECT
    a.id,
    a.task_id,
    a.actor_type,
    a.actor_id,
    a.action,
    a.created_at,
    t.number AS task_number,
    t.title AS task_title,
    t.project_id,
    p.key AS project_key
FROM task_activities a
JOIN tasks t ON t.id = a.task_id
JOIN projects p ON p.id = t.project_id
WHERE t.organization_id = sqlc.arg('organization_id')
  AND a.created_at >= sqlc.arg('since')
  AND (sqlc.narg('project_id')::uuid IS NULL OR t.project_id = sqlc.narg('project_id'))
  AND (
      sqlc.narg('actor_id')::uuid IS NULL
      OR a.actor_id = sqlc.narg('actor_id')
      -- A person's work includes what their coding agents did for them.
      OR (
          sqlc.arg('include_owned_agents')::boolean
          AND a.actor_type = 'agent'
          AND a.actor_id IN (SELECT ag.id FROM agents ag WHERE ag.developer_id = sqlc.narg('actor_id'))
      )
  )
ORDER BY a.created_at DESC
LIMIT sqlc.arg('row_limit');
