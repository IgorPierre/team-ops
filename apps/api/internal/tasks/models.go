package tasks

import (
	"context"
	"encoding/json"
	"net/http"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/shopspring/decimal"

	"github.com/team-ops/api/internal/actor"
	"github.com/team-ops/api/internal/apperr"
	"github.com/team-ops/api/internal/db"
)

const (
	StatusBacklog    = "backlog"
	StatusInProgress = "in_progress"
	StatusReview     = "review"
	StatusDone       = "done"

	ActionCreated           = "task.created"
	ActionUpdated           = "task.updated"
	ActionAssigned          = "task.assigned"
	ActionUnassigned        = "task.unassigned"
	ActionMoved             = "task.moved"
	ActionStarted           = "task.started"
	ActionBlocked           = "task.blocked"
	ActionUnblocked         = "task.unblocked"
	ActionProgressReported  = "task.progress_reported"
	ActionReviewRequested   = "task.review_requested"
	ActionCompleted         = "task.completed"
	ActionReopened          = "task.reopened"
	ActionArchived          = "task.archived"
	ActionCommentCreated    = "comment.created"
)

var columnOrder = []string{StatusBacklog, StatusInProgress, StatusReview, StatusDone}

type TaskDTO struct {
	ID                 uuid.UUID       `json:"id"`
	Number             int32           `json:"number"`
	Key                string          `json:"key"`
	OrganizationID     uuid.UUID       `json:"organizationId"`
	ProjectID          uuid.UUID       `json:"projectId"`
	ProjectKey         string          `json:"projectKey"`
	ProjectName        string          `json:"projectName"`
	Title              string          `json:"title"`
	Description        string          `json:"description"`
	AcceptanceCriteria string          `json:"acceptanceCriteria"`
	Status             string          `json:"status"`
	Priority           string          `json:"priority"`
	AssigneeID         *uuid.UUID      `json:"assigneeId"`
	ReporterID         *uuid.UUID      `json:"reporterId"`
	DueDate            *string         `json:"dueDate"`
	Position           string          `json:"position"`
	Blocked            bool            `json:"blocked"`
	BlockedReason      *string         `json:"blockedReason"`
	Source             string          `json:"source"`
	ExternalRef        *string         `json:"externalRef"`
	SourceMetadata     json.RawMessage `json:"sourceMetadata"`
	CompletionSummary  *string         `json:"completionSummary"`
	Version            int32           `json:"version"`
	CommentCount       int32           `json:"commentCount"`
	CreatedAt          time.Time       `json:"createdAt"`
	UpdatedAt          time.Time       `json:"updatedAt"`
}

type CommentDTO struct {
	ID         uuid.UUID       `json:"id"`
	TaskID     uuid.UUID       `json:"taskId"`
	AuthorType string          `json:"authorType"`
	AuthorID   *uuid.UUID      `json:"authorId"`
	Content    string          `json:"content"`
	Metadata   json.RawMessage `json:"metadata"`
	CreatedAt  time.Time       `json:"createdAt"`
}

type ActivityDTO struct {
	ID        uuid.UUID       `json:"id"`
	TaskID    uuid.UUID       `json:"taskId"`
	ActorType string          `json:"actorType"`
	ActorID   *uuid.UUID      `json:"actorId"`
	Action    string          `json:"action"`
	OldValue  json.RawMessage `json:"oldValue"`
	NewValue  json.RawMessage `json:"newValue"`
	Metadata  json.RawMessage `json:"metadata"`
	CreatedAt time.Time       `json:"createdAt"`
}

func dtoFrom(t db.Task, projectKey, projectName string, commentCount int32) TaskDTO {
	var due *string
	if t.DueDate.Valid {
		v := t.DueDate.Time.Format("2006-01-02")
		due = &v
	}
	meta := json.RawMessage(t.SourceMetadata)
	if len(meta) == 0 {
		meta = json.RawMessage(`{}`)
	}
	return TaskDTO{
		ID:                 t.ID,
		Number:             t.Number,
		Key:                projectKey + "-" + itoa(t.Number),
		OrganizationID:     t.OrganizationID,
		ProjectID:          t.ProjectID,
		ProjectKey:         projectKey,
		ProjectName:        projectName,
		Title:              t.Title,
		Description:        t.Description,
		AcceptanceCriteria: t.AcceptanceCriteria,
		Status:             t.Status,
		Priority:           t.Priority,
		AssigneeID:         t.AssigneeID,
		ReporterID:         t.ReporterID,
		DueDate:            due,
		Position:           t.Position.String(),
		Blocked:            t.Blocked,
		BlockedReason:      t.BlockedReason,
		Source:             t.Source,
		ExternalRef:        t.ExternalRef,
		SourceMetadata:     meta,
		CompletionSummary:  t.CompletionSummary,
		Version:            t.Version,
		CommentCount:       commentCount,
		CreatedAt:          t.CreatedAt.Time,
		UpdatedAt:          t.UpdatedAt.Time,
	}
}

func itoa(n int32) string {
	if n == 0 {
		return "0"
	}
	var b [12]byte
	i := len(b)
	u := uint32(n)
	if n < 0 {
		u = uint32(-n)
	}
	for u > 0 {
		i--
		b[i] = byte('0' + u%10)
		u /= 10
	}
	if n < 0 {
		i--
		b[i] = '-'
	}
	return string(b[i:])
}

func validStatus(s string) bool {
	switch s {
	case StatusBacklog, StatusInProgress, StatusReview, StatusDone:
		return true
	}
	return false
}

func validPriority(s string) bool {
	return s == "low" || s == "medium" || s == "high"
}

func conflict() error {
	return apperr.New("TASK_VERSION_CONFLICT", "Task was modified by another actor.", http.StatusConflict)
}

func forbiddenWrite() error {
	return apperr.New("FORBIDDEN", "You do not have permission to modify tasks.", http.StatusForbidden)
}

func requireWrite(a actor.Actor, scope string) error {
	if a.IsViewer() {
		return forbiddenWrite()
	}
	if a.IsAgent() && !a.HasScope(scope) {
		return apperr.New("FORBIDDEN", "Missing required scope: "+scope, http.StatusForbidden)
	}
	if a.IsUser() && !a.CanWriteTasks() {
		return forbiddenWrite()
	}
	return nil
}

func jsonVal(v any) []byte {
	b, _ := json.Marshal(v)
	return b
}

func textDate(s *string) pgtype.Date {
	if s == nil || *s == "" {
		return pgtype.Date{}
	}
	t, err := time.Parse("2006-01-02", *s)
	if err != nil {
		return pgtype.Date{}
	}
	return pgtype.Date{Time: t, Valid: true}
}

func parsePosition(s string) (decimal.Decimal, error) {
	if strings.TrimSpace(s) == "" {
		return decimal.Zero, apperr.New("VALIDATION", "position is required.", http.StatusBadRequest)
	}
	d, err := decimal.NewFromString(s)
	if err != nil {
		return decimal.Zero, apperr.New("VALIDATION", "position must be numeric.", http.StatusBadRequest)
	}
	return d, nil
}

func minGap() decimal.Decimal {
	return decimal.RequireFromString("0.000001")
}

func nextPosition(ctx context.Context, q *db.Queries, orgID uuid.UUID, projectID *uuid.UUID, status string) (decimal.Decimal, error) {
	max, err := q.MaxPositionInColumn(ctx, db.MaxPositionInColumnParams{
		OrganizationID:  orgID,
		FilterProjectID: projectID,
		ColumnStatus:    status,
	})
	if err != nil {
		return decimal.Zero, err
	}
	return max.Add(decimal.NewFromInt(1000)), nil
}

func shouldNormalize(before, after decimal.Decimal) bool {
	if after.IsZero() {
		return false
	}
	return after.Sub(before).Abs().LessThan(minGap())
}
