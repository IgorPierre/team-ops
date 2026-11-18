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
    source_metadata,
    proof_kind,
    proof_url
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19
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
      -- Task keys like ERP-142 are project key + number, not stored on the row.
      OR EXISTS (
          SELECT 1 FROM projects kp
          WHERE kp.id = t.project_id
            AND upper(kp.key || '-' || t.number::text) = upper(trim(sqlc.narg('search')))
      )
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
    proof_kind = COALESCE(sqlc.narg('proof_kind'), proof_kind),
    proof_url = CASE WHEN sqlc.narg('proof_kind')::text IS NULL THEN proof_url ELSE sqlc.narg('proof_url') END,
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
    blocked = CASE WHEN sqlc.arg('unblock')::boolean THEN FALSE ELSE blocked END,
    blocked_reason = CASE WHEN sqlc.arg('unblock')::boolean THEN NULL ELSE blocked_reason END,
    status = sqlc.arg('status'),
    position = sqlc.arg('position'),
    proof_kind = COALESCE(sqlc.narg('proof_kind'), proof_kind),
    proof_url = CASE WHEN sqlc.narg('proof_kind')::text IS NULL THEN proof_url ELSE sqlc.narg('proof_url') END,
    version = version + 1,
    updated_at = now()
WHERE id = sqlc.arg('id')
  AND version = sqlc.arg('version')
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

-- name: ListReportTasks :many
-- Tasks relevant to a report window: created or completed in it, or still open.
-- started_at / completed_at come from the activity log (tasks have no such columns).
SELECT
    t.id,
    t.number,
    t.title,
    t.status,
    t.priority,
    t.source,
    t.blocked,
    t.due_date,
    t.assignee_id,
    t.project_id,
    t.completion_summary,
    t.created_at,
    p.key AS project_key,
    (
        SELECT min(a.created_at) FROM task_activities a
        WHERE a.task_id = t.id
          AND (a.action = 'task.started' OR (a.action IN ('task.moved', 'task.created') AND a.new_value->>'status' = 'in_progress'))
    )::timestamptz AS started_at,
    -- Done via the complete endpoint or a drag to the Done column;
    -- tasks with no such history (imports, seeds) fall back to their last update.
    CASE WHEN t.status IN ('done', 'production') THEN COALESCE(
        (
            SELECT max(a.created_at) FROM task_activities a
            WHERE a.task_id = t.id
              AND (a.action = 'task.completed' OR (a.action = 'task.moved' AND a.new_value->>'status' IN ('done', 'production')))
        ),
        t.updated_at
    ) END::timestamptz AS completed_at
FROM tasks t
JOIN projects p ON p.id = t.project_id
WHERE t.organization_id = sqlc.arg('organization_id')
  AND t.archived_at IS NULL
  AND (sqlc.narg('project_id')::uuid IS NULL OR t.project_id = sqlc.narg('project_id'))
  AND (
      t.status NOT IN ('done', 'production')
      OR t.created_at >= sqlc.arg('since')
      OR t.updated_at >= sqlc.arg('since')
  )
ORDER BY t.created_at;
