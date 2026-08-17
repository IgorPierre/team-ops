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
