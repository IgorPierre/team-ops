-- name: CreateTask :one
INSERT INTO tasks (
    number,
    organization_id,
    project_id,
    title,
    description,
    acceptance_criteria,
    status,
    priority,
    assignee_id,
    reporter_id,
    due_date,
    position,
    blocked,
    blocked_reason,
    source,
    external_ref,
    source_metadata
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17
)
RETURNING *;

-- name: GetTask :one
SELECT * FROM tasks
WHERE id = $1
  AND archived_at IS NULL;

-- name: GetTaskIncludingArchived :one
SELECT * FROM tasks WHERE id = $1;

-- name: GetTaskByExternalRef :one
SELECT * FROM tasks
WHERE project_id = $1
  AND external_ref = $2
  AND archived_at IS NULL;

-- name: ListTasks :many
SELECT t.*
FROM tasks t
WHERE t.organization_id = sqlc.arg('organization_id')
  AND t.archived_at IS NULL
  AND (sqlc.narg('project_id')::uuid IS NULL OR t.project_id = sqlc.narg('project_id'))
  AND (sqlc.narg('assignee_id')::uuid IS NULL OR t.assignee_id = sqlc.narg('assignee_id'))
  AND (sqlc.narg('status')::text IS NULL OR t.status = sqlc.narg('status'))
  AND (sqlc.narg('priority')::text IS NULL OR t.priority = sqlc.narg('priority'))
  AND (sqlc.narg('blocked')::boolean IS NULL OR t.blocked = sqlc.narg('blocked'))
  AND (sqlc.narg('source')::text IS NULL OR t.source = sqlc.narg('source'))
  AND (sqlc.narg('updated_after')::timestamptz IS NULL OR t.updated_at >= sqlc.narg('updated_after'))
  AND (
      sqlc.narg('search')::text IS NULL
      OR t.title ILIKE '%' || sqlc.narg('search') || '%'
      OR t.description ILIKE '%' || sqlc.narg('search') || '%'
      OR t.external_ref ILIKE '%' || sqlc.narg('search') || '%'
  )
ORDER BY t.status, t.position ASC, t.created_at ASC;

-- name: CountTaskComments :many
SELECT task_id, count(*)::int AS comment_count
FROM task_comments
WHERE task_id = ANY(sqlc.arg('task_ids')::uuid[])
GROUP BY task_id;

-- name: UpdateTask :one
UPDATE tasks
SET
    title = COALESCE(sqlc.narg('title'), title),
    description = COALESCE(sqlc.narg('description'), description),
    acceptance_criteria = COALESCE(sqlc.narg('acceptance_criteria'), acceptance_criteria),
    status = COALESCE(sqlc.narg('status'), status),
    priority = COALESCE(sqlc.narg('priority'), priority),
    assignee_id = COALESCE(sqlc.narg('assignee_id'), assignee_id),
    due_date = COALESCE(sqlc.narg('due_date'), due_date),
    position = COALESCE(sqlc.narg('position'), position),
    blocked = COALESCE(sqlc.narg('blocked'), blocked),
    blocked_reason = COALESCE(sqlc.narg('blocked_reason'), blocked_reason),
    source = COALESCE(sqlc.narg('source'), source),
    external_ref = COALESCE(sqlc.narg('external_ref'), external_ref),
    source_metadata = COALESCE(sqlc.narg('source_metadata'), source_metadata),
    completion_summary = COALESCE(sqlc.narg('completion_summary'), completion_summary),
    version = version + 1,
    updated_at = now()
WHERE id = sqlc.arg('id')
  AND version = sqlc.arg('expected_version')
  AND archived_at IS NULL
RETURNING *;

-- name: ClearTaskAssignee :one
UPDATE tasks
SET
    assignee_id = NULL,
    version = version + 1,
    updated_at = now()
WHERE id = sqlc.arg('id')
  AND version = sqlc.arg('expected_version')
  AND archived_at IS NULL
RETURNING *;

-- name: MoveTask :one
UPDATE tasks
SET
    status = $1,
    position = $2,
    version = version + 1,
    updated_at = now()
WHERE id = $3
  AND version = $4
  AND archived_at IS NULL
RETURNING *;

-- name: ArchiveTask :one
UPDATE tasks
SET
    archived_at = now(),
    version = version + 1,
    updated_at = now()
WHERE id = $1
  AND version = $2
  AND archived_at IS NULL
RETURNING *;

-- name: ListTaskPositionsInColumn :many
SELECT id, position
FROM tasks
WHERE project_id = $1
  AND status = $2
  AND archived_at IS NULL
ORDER BY position ASC;

-- name: NormalizeTaskPositions :exec
WITH ordered AS (
    SELECT id, (row_number() OVER (ORDER BY position, created_at) * 1000)::numeric AS new_pos
    FROM tasks
    WHERE tasks.project_id = sqlc.arg('project_id')
      AND tasks.status = sqlc.arg('status')
      AND tasks.archived_at IS NULL
)
UPDATE tasks t
SET position = ordered.new_pos, updated_at = now()
FROM ordered
WHERE t.id = ordered.id;

-- name: MaxPositionInColumn :one
SELECT COALESCE(max(position), 0)::numeric AS max_position
FROM tasks
WHERE organization_id = sqlc.arg('organization_id')
  AND (sqlc.narg('filter_project_id')::uuid IS NULL OR project_id = sqlc.narg('filter_project_id'))
  AND status = sqlc.arg('column_status')
  AND archived_at IS NULL;
