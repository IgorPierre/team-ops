package tasks

import (
	"context"
	"encoding/json"
	"net/http"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/shopspring/decimal"

	"github.com/team-ops/api/internal/actor"
	"github.com/team-ops/api/internal/apperr"
	"github.com/team-ops/api/internal/auth"
	"github.com/team-ops/api/internal/db"
	"github.com/team-ops/api/internal/organizations"
	httpx "github.com/team-ops/api/platform/http"
)

type Service struct {
	q    *db.Queries
	pool *pgxpool.Pool
	orgs *organizations.Service
}

func New(pool *pgxpool.Pool, orgs *organizations.Service) *Service {
	return &Service{q: db.New(pool), pool: pool, orgs: orgs}
}

func (s *Service) Routes() chi.Router {
	r := chi.NewRouter()
	r.Get("/", s.list)
	r.Post("/", s.create)
	r.Get("/{taskID}", s.get)
	r.Patch("/{taskID}", s.update)
	r.Post("/{taskID}/move", s.move)
	r.Post("/{taskID}/progress", s.progress)
	r.Post("/{taskID}/comments", s.addComment)
	r.Get("/{taskID}/comments", s.listComments)
	r.Post("/{taskID}/block", s.block)
	r.Post("/{taskID}/unblock", s.unblock)
	r.Post("/{taskID}/review", s.review)
	r.Post("/{taskID}/complete", s.complete)
	r.Post("/{taskID}/archive", s.archive)
	r.Get("/{taskID}/activities", s.listActivities)
	return r
}

func (s *Service) list(w http.ResponseWriter, r *http.Request) {
	a, ok := auth.RequireActor(w, r)
	if !ok {
		return
	}
	q := r.URL.Query()
	orgID, err := uuid.Parse(q.Get("organizationId"))
	if err != nil {
		httpx.Error(w, apperr.New("VALIDATION", "organizationId is required.", http.StatusBadRequest))
		return
	}
	a, _, err = s.orgs.Authorize(r.Context(), a, orgID)
	if err != nil {
		httpx.Error(w, err)
		return
	}
	if a.IsAgent() && !a.HasScope("tasks:read") {
		httpx.Error(w, apperr.New("FORBIDDEN", "Missing tasks:read scope.", http.StatusForbidden))
		return
	}
	params := db.ListTasksParams{OrganizationID: orgID}
	if v := q.Get("projectId"); v != "" {
		id, err := uuid.Parse(v)
		if err != nil {
			httpx.Error(w, apperr.New("VALIDATION", "Invalid projectId.", http.StatusBadRequest))
			return
		}
		params.ProjectID = &id
	}
	if v := q.Get("assigneeId"); v != "" {
		id, err := uuid.Parse(v)
		if err != nil {
			httpx.Error(w, apperr.New("VALIDATION", "Invalid assigneeId.", http.StatusBadRequest))
			return
		}
		params.AssigneeID = &id
	}
	if v := q.Get("status"); v != "" {
		params.Status = &v
	}
	if v := q.Get("priority"); v != "" {
		params.Priority = &v
	}
	if v := q.Get("source"); v != "" {
		params.Source = &v
	}
	if v := q.Get("blocked"); v != "" {
		b := v == "true" || v == "1"
		params.Blocked = &b
	}
	if v := q.Get("search"); v != "" {
		params.Search = &v
	}
	if v := q.Get("updatedAfter"); v != "" {
		t, err := time.Parse(time.RFC3339, v)
		if err != nil {
			httpx.Error(w, apperr.New("VALIDATION", "updatedAfter must be RFC3339.", http.StatusBadRequest))
			return
		}
		params.UpdatedAfter = pgtype.Timestamptz{Time: t, Valid: true}
	}
	if v := q.Get("externalRef"); v != "" && params.ProjectID != nil {
		task, err := s.q.GetTaskByExternalRef(r.Context(), db.GetTaskByExternalRefParams{
			ProjectID:   *params.ProjectID,
			ExternalRef: &v,
		})
		if err != nil {
			httpx.JSON(w, http.StatusOK, []TaskDTO{}, nil)
			return
		}
		dto, err := s.enrich(r.Context(), task)
		if err != nil {
			httpx.Error(w, err)
			return
		}
		httpx.JSON(w, http.StatusOK, []TaskDTO{dto}, nil)
		return
	}
	rows, err := s.q.ListTasks(r.Context(), params)
	if err != nil {
		httpx.Error(w, err)
		return
	}
	out, err := s.enrichMany(r.Context(), rows)
	if err != nil {
		httpx.Error(w, err)
		return
	}
	httpx.JSON(w, http.StatusOK, out, nil)
}

type createTaskRequest struct {
	OrganizationID     uuid.UUID       `json:"organizationId"`
	ProjectID          uuid.UUID       `json:"projectId"`
	Title              string          `json:"title"`
	Description        string          `json:"description"`
	AcceptanceCriteria string          `json:"acceptanceCriteria"`
	Status             string          `json:"status"`
	Priority           string          `json:"priority"`
	AssigneeID         *uuid.UUID      `json:"assigneeId"`
	DueDate            *string         `json:"dueDate"`
	ExternalRef        *string         `json:"externalRef"`
	Source             string          `json:"source"`
	SourceMetadata     json.RawMessage `json:"sourceMetadata"`
}

func (s *Service) create(w http.ResponseWriter, r *http.Request) {
	a, ok := auth.RequireActor(w, r)
	if !ok {
		return
	}
	var req createTaskRequest
	if err := httpx.Decode(r, &req); err != nil {
		httpx.Error(w, err)
		return
	}
	task, err := s.Create(r.Context(), a, req)
	if err != nil {
		httpx.Error(w, err)
		return
	}
	httpx.JSON(w, http.StatusCreated, task, nil)
}

func (s *Service) Create(ctx context.Context, a actor.Actor, req createTaskRequest) (TaskDTO, error) {
	a, _, err := s.orgs.Authorize(ctx, a, req.OrganizationID)
	if err != nil {
		return TaskDTO{}, err
	}
	if err := requireWrite(a, "tasks:create"); err != nil {
		return TaskDTO{}, err
	}
	req.Title = strings.TrimSpace(req.Title)
	if req.Title == "" {
		return TaskDTO{}, apperr.New("VALIDATION", "Title is required.", http.StatusBadRequest)
	}
	if req.Status == "" {
		req.Status = StatusBacklog
	}
	if req.Priority == "" {
		req.Priority = "medium"
	}
	if !validStatus(req.Status) || !validPriority(req.Priority) {
		return TaskDTO{}, apperr.New("VALIDATION", "Invalid status or priority.", http.StatusBadRequest)
	}
	project, err := s.q.GetProject(ctx, req.ProjectID)
	if err != nil || project.OrganizationID != req.OrganizationID {
		return TaskDTO{}, apperr.New("NOT_FOUND", "Project not found.", http.StatusNotFound)
	}
	if req.ExternalRef != nil && strings.TrimSpace(*req.ExternalRef) != "" {
		if _, err := s.q.GetTaskByExternalRef(ctx, db.GetTaskByExternalRefParams{
			ProjectID:   req.ProjectID,
			ExternalRef: req.ExternalRef,
		}); err == nil {
			return TaskDTO{}, apperr.New("DUPLICATE_EXTERNAL_REF", "A task with this external_ref already exists in the project.", http.StatusConflict)
		}
	}
	source := req.Source
	if source == "" {
		if a.IsAgent() {
			source = "ai"
		} else {
			source = "manual"
		}
	}
	number, err := s.q.IncrementProjectTaskCounter(ctx, req.ProjectID)
	if err != nil {
		return TaskDTO{}, err
	}
	pos, err := nextPosition(ctx, s.q, req.OrganizationID, &req.ProjectID, req.Status)
	if err != nil {
		return TaskDTO{}, err
	}
	meta := req.SourceMetadata
	if len(meta) == 0 {
		meta = json.RawMessage(`{}`)
	}
	var reporter *uuid.UUID
	if a.IsUser() {
		reporter = &a.ID
	} else if a.DeveloperID != nil {
		reporter = a.DeveloperID
	}
	task, err := s.q.CreateTask(ctx, db.CreateTaskParams{
		Number:             number,
		OrganizationID:     req.OrganizationID,
		ProjectID:          req.ProjectID,
		Title:              req.Title,
		Description:        req.Description,
		AcceptanceCriteria: req.AcceptanceCriteria,
		Status:             req.Status,
		Priority:           req.Priority,
		AssigneeID:         req.AssigneeID,
		ReporterID:         reporter,
		DueDate:            textDate(req.DueDate),
		Position:           pos,
		Blocked:            false,
		BlockedReason:      nil,
		Source:             source,
		ExternalRef:        emptyToNil(req.ExternalRef),
		SourceMetadata:     meta,
	})
	if err != nil {
		if auth.IsUnique(err) {
			return TaskDTO{}, apperr.New("DUPLICATE_EXTERNAL_REF", "A task with this external_ref already exists in the project.", http.StatusConflict)
		}
		return TaskDTO{}, err
	}
	_ = s.record(ctx, a, task.ID, ActionCreated, nil, map[string]any{"title": task.Title, "status": task.Status}, nil)
	return s.enrich(ctx, task)
}

func (s *Service) get(w http.ResponseWriter, r *http.Request) {
	task, _, ok := s.loadTask(w, r, "tasks:read")
	if !ok {
		return
	}
	dto, err := s.enrich(r.Context(), task)
	if err != nil {
		httpx.Error(w, err)
		return
	}
	httpx.JSON(w, http.StatusOK, dto, nil)
}

type patchTaskRequest struct {
	Title              *string    `json:"title"`
	Description        *string    `json:"description"`
	AcceptanceCriteria *string    `json:"acceptanceCriteria"`
	Status             *string    `json:"status"`
	Priority           *string    `json:"priority"`
	AssigneeID         *uuid.UUID `json:"assigneeId"`
	ClearAssignee      bool       `json:"clearAssignee"`
	DueDate            *string    `json:"dueDate"`
	ExpectedVersion    int32      `json:"expectedVersion"`
}

func (s *Service) update(w http.ResponseWriter, r *http.Request) {
	task, a, ok := s.loadTask(w, r, "tasks:update")
	if !ok {
		return
	}
	if err := requireWrite(a, "tasks:update"); err != nil {
		httpx.Error(w, err)
		return
	}
	var req patchTaskRequest
	if err := httpx.Decode(r, &req); err != nil {
		httpx.Error(w, err)
		return
	}
	if req.Status != nil && !validStatus(*req.Status) {
		httpx.Error(w, apperr.New("VALIDATION", "Invalid status.", http.StatusBadRequest))
		return
	}
	if req.Priority != nil && !validPriority(*req.Priority) {
		httpx.Error(w, apperr.New("VALIDATION", "Invalid priority.", http.StatusBadRequest))
		return
	}
	params := db.UpdateTaskParams{
		ID:                   task.ID,
		ExpectedVersion:      req.ExpectedVersion,
		Title:                req.Title,
		Description:          req.Description,
		AcceptanceCriteria:   req.AcceptanceCriteria,
		Status:               req.Status,
		Priority:             req.Priority,
		AssigneeID:           req.AssigneeID,
		DueDate:              textDate(req.DueDate),
	}
	updated, err := s.q.UpdateTask(r.Context(), params)
	if err != nil || (req.ClearAssignee && false) {
		if auth.PgErrIsNoRows(err) || (err == nil && updated.ID == uuid.Nil) {
			httpx.Error(w, conflict())
			return
		}
		if err != nil {
			httpx.Error(w, err)
			return
		}
	}
	if req.ClearAssignee {
		cleared, err := s.q.ClearTaskAssignee(r.Context(), db.ClearTaskAssigneeParams{
			ID:              updated.ID,
			ExpectedVersion: updated.Version,
		})
		if err != nil {
			if auth.PgErrIsNoRows(err) {
				httpx.Error(w, conflict())
				return
			}
			httpx.Error(w, err)
			return
		}
		updated = cleared
		_ = s.record(r.Context(), a, updated.ID, ActionUnassigned, map[string]any{"assigneeId": task.AssigneeID}, nil, nil)
	}
	if req.AssigneeID != nil && (task.AssigneeID == nil || *task.AssigneeID != *req.AssigneeID) {
		_ = s.record(r.Context(), a, updated.ID, ActionAssigned, map[string]any{"assigneeId": task.AssigneeID}, map[string]any{"assigneeId": req.AssigneeID}, nil)
	}
	_ = s.record(r.Context(), a, updated.ID, ActionUpdated, nil, map[string]any{"title": updated.Title, "status": updated.Status}, nil)
	dto, err := s.enrich(r.Context(), updated)
	if err != nil {
		httpx.Error(w, err)
		return
	}
	httpx.JSON(w, http.StatusOK, dto, nil)
}

type moveRequest struct {
	Status          string `json:"status"`
	Position        string `json:"position"`
	ExpectedVersion int32  `json:"expectedVersion"`
}

func (s *Service) move(w http.ResponseWriter, r *http.Request) {
	task, a, ok := s.loadTask(w, r, "tasks:move")
	if !ok {
		return
	}
	if err := requireWrite(a, "tasks:move"); err != nil {
		httpx.Error(w, err)
		return
	}
	var req moveRequest
	if err := httpx.Decode(r, &req); err != nil {
		httpx.Error(w, err)
		return
	}
	dto, err := s.Move(r.Context(), a, task, req)
	if err != nil {
		httpx.Error(w, err)
		return
	}
	httpx.JSON(w, http.StatusOK, dto, nil)
}

func (s *Service) Move(ctx context.Context, a actor.Actor, task db.Task, req moveRequest) (TaskDTO, error) {
	if !validStatus(req.Status) {
		return TaskDTO{}, apperr.New("VALIDATION", "Invalid status.", http.StatusBadRequest)
	}
	var pos decimal.Decimal
	var err error
	if req.Position != "" {
		pos, err = parsePosition(req.Position)
		if err != nil {
			return TaskDTO{}, err
		}
	} else {
		pos, err = nextPosition(ctx, s.q, task.OrganizationID, &task.ProjectID, req.Status)
		if err != nil {
			return TaskDTO{}, err
		}
	}
	updated, err := s.q.MoveTask(ctx, db.MoveTaskParams{
		Status:   req.Status,
		Position: pos,
		ID:       task.ID,
		Version:  req.ExpectedVersion,
	})
	if err != nil {
		if auth.PgErrIsNoRows(err) {
			return TaskDTO{}, conflict()
		}
		return TaskDTO{}, err
	}
	action := ActionMoved
	if task.Status == StatusBacklog && req.Status == StatusInProgress {
		action = ActionStarted
	}
	if task.Status == StatusDone && req.Status != StatusDone {
		action = ActionReopened
	}
	_ = s.record(ctx, a, updated.ID, action, map[string]any{"status": task.Status, "position": task.Position.String()}, map[string]any{"status": updated.Status, "position": updated.Position.String()}, nil)
	_ = s.maybeNormalize(ctx, updated.ProjectID, updated.Status)
	return s.enrich(ctx, updated)
}

type progressRequest struct {
	Summary         string   `json:"summary"`
	Branch          *string  `json:"branch"`
	CommitShas      []string `json:"commitShas"`
	PullRequestURL  *string  `json:"pullRequestUrl"`
	Tests           *string  `json:"tests"`
	Blockers        *string  `json:"blockers"`
	ExpectedVersion int32    `json:"expectedVersion"`
}

func (s *Service) progress(w http.ResponseWriter, r *http.Request) {
	task, a, ok := s.loadTask(w, r, "tasks:update")
	if !ok {
		return
	}
	if err := requireWrite(a, "tasks:update"); err != nil {
		httpx.Error(w, err)
		return
	}
	var req progressRequest
	if err := httpx.Decode(r, &req); err != nil {
		httpx.Error(w, err)
		return
	}
	if strings.TrimSpace(req.Summary) == "" {
		httpx.Error(w, apperr.New("VALIDATION", "summary is required.", http.StatusBadRequest))
		return
	}
	if task.Version != req.ExpectedVersion {
		httpx.Error(w, conflict())
		return
	}
	meta := map[string]any{
		"summary":        req.Summary,
		"branch":         req.Branch,
		"commitShas":     req.CommitShas,
		"pullRequestUrl": req.PullRequestURL,
		"tests":          req.Tests,
		"blockers":       req.Blockers,
	}
	_ = s.record(r.Context(), a, task.ID, ActionProgressReported, nil, meta, meta)
	if req.Blockers != nil && strings.TrimSpace(*req.Blockers) != "" {
		reason := strings.TrimSpace(*req.Blockers)
		updated, err := s.q.UpdateTask(r.Context(), db.UpdateTaskParams{
			ID:              task.ID,
			ExpectedVersion: req.ExpectedVersion,
			Blocked:         boolPtr(true),
			BlockedReason:   &reason,
		})
		if err != nil {
			if auth.PgErrIsNoRows(err) {
				httpx.Error(w, conflict())
				return
			}
			httpx.Error(w, err)
			return
		}
		_ = s.record(r.Context(), a, updated.ID, ActionBlocked, nil, map[string]any{"reason": reason}, nil)
		dto, err := s.enrich(r.Context(), updated)
		if err != nil {
			httpx.Error(w, err)
			return
		}
		httpx.JSON(w, http.StatusOK, dto, nil)
		return
	}
	dto, err := s.enrich(r.Context(), task)
	if err != nil {
		httpx.Error(w, err)
		return
	}
	httpx.JSON(w, http.StatusOK, dto, nil)
}

type commentRequest struct {
	Content  string          `json:"content"`
	Metadata json.RawMessage `json:"metadata"`
}

func (s *Service) addComment(w http.ResponseWriter, r *http.Request) {
	task, a, ok := s.loadTask(w, r, "tasks:comment")
	if !ok {
		return
	}
	if err := requireWrite(a, "tasks:comment"); err != nil {
		httpx.Error(w, err)
		return
	}
	var req commentRequest
	if err := httpx.Decode(r, &req); err != nil {
		httpx.Error(w, err)
		return
	}
	req.Content = strings.TrimSpace(req.Content)
	if req.Content == "" {
		httpx.Error(w, apperr.New("VALIDATION", "content is required.", http.StatusBadRequest))
		return
	}
	meta := req.Metadata
	if len(meta) == 0 {
		meta = json.RawMessage(`{}`)
	}
	c, err := s.q.CreateComment(r.Context(), db.CreateCommentParams{
		TaskID:     task.ID,
		AuthorType: string(a.Type),
		AuthorID:   &a.ID,
		Content:    req.Content,
		Metadata:   meta,
	})
	if err != nil {
		httpx.Error(w, err)
		return
	}
	_ = s.record(r.Context(), a, task.ID, ActionCommentCreated, nil, map[string]any{"commentId": c.ID}, nil)
	httpx.JSON(w, http.StatusCreated, commentDTO(c), nil)
}

func (s *Service) listComments(w http.ResponseWriter, r *http.Request) {
	task, _, ok := s.loadTask(w, r, "tasks:read")
	if !ok {
		return
	}
	rows, err := s.q.ListCommentsByTask(r.Context(), task.ID)
	if err != nil {
		httpx.Error(w, err)
		return
	}
	out := make([]CommentDTO, 0, len(rows))
	for _, c := range rows {
		out = append(out, commentDTO(c))
	}
	httpx.JSON(w, http.StatusOK, out, nil)
}

type blockRequest struct {
	Reason          string `json:"reason"`
	ExpectedVersion int32  `json:"expectedVersion"`
}

func (s *Service) block(w http.ResponseWriter, r *http.Request) {
	task, a, ok := s.loadTask(w, r, "tasks:update")
	if !ok {
		return
	}
	if err := requireWrite(a, "tasks:update"); err != nil {
		httpx.Error(w, err)
		return
	}
	var req blockRequest
	if err := httpx.Decode(r, &req); err != nil {
		httpx.Error(w, err)
		return
	}
	if strings.TrimSpace(req.Reason) == "" {
		httpx.Error(w, apperr.New("VALIDATION", "reason is required.", http.StatusBadRequest))
		return
	}
	reason := strings.TrimSpace(req.Reason)
	updated, err := s.q.UpdateTask(r.Context(), db.UpdateTaskParams{
		ID:              task.ID,
		ExpectedVersion: req.ExpectedVersion,
		Blocked:         boolPtr(true),
		BlockedReason:   &reason,
	})
	if err != nil {
		if auth.PgErrIsNoRows(err) {
			httpx.Error(w, conflict())
			return
		}
		httpx.Error(w, err)
		return
	}
	_ = s.record(r.Context(), a, updated.ID, ActionBlocked, nil, map[string]any{"reason": reason}, nil)
	dto, err := s.enrich(r.Context(), updated)
	if err != nil {
		httpx.Error(w, err)
		return
	}
	httpx.JSON(w, http.StatusOK, dto, nil)
}

func (s *Service) unblock(w http.ResponseWriter, r *http.Request) {
	task, a, ok := s.loadTask(w, r, "tasks:update")
	if !ok {
		return
	}
	if err := requireWrite(a, "tasks:update"); err != nil {
		httpx.Error(w, err)
		return
	}
	var req struct {
		ExpectedVersion int32 `json:"expectedVersion"`
	}
	if err := httpx.Decode(r, &req); err != nil {
		httpx.Error(w, err)
		return
	}
	empty := ""
	updated, err := s.q.UpdateTask(r.Context(), db.UpdateTaskParams{
		ID:              task.ID,
		ExpectedVersion: req.ExpectedVersion,
		Blocked:         boolPtr(false),
		BlockedReason:   &empty,
	})
	if err != nil {
		if auth.PgErrIsNoRows(err) {
			httpx.Error(w, conflict())
			return
		}
		httpx.Error(w, err)
		return
	}
	_ = s.record(r.Context(), a, updated.ID, ActionUnblocked, map[string]any{"reason": task.BlockedReason}, nil, nil)
	dto, err := s.enrich(r.Context(), updated)
	if err != nil {
		httpx.Error(w, err)
		return
	}
	httpx.JSON(w, http.StatusOK, dto, nil)
}

type reviewRequest struct {
	Summary         string   `json:"summary"`
	PullRequestURL  *string  `json:"pullRequestUrl"`
	CommitShas      []string `json:"commitShas"`
	Tests           *string  `json:"tests"`
	ExpectedVersion int32    `json:"expectedVersion"`
}

func (s *Service) review(w http.ResponseWriter, r *http.Request) {
	task, a, ok := s.loadTask(w, r, "tasks:move")
	if !ok {
		return
	}
	if err := requireWrite(a, "tasks:move"); err != nil {
		httpx.Error(w, err)
		return
	}
	var req reviewRequest
	if err := httpx.Decode(r, &req); err != nil {
		httpx.Error(w, err)
		return
	}
	if strings.TrimSpace(req.Summary) == "" {
		httpx.Error(w, apperr.New("VALIDATION", "summary is required.", http.StatusBadRequest))
		return
	}
	pos, err := nextPosition(r.Context(), s.q, task.OrganizationID, &task.ProjectID, StatusReview)
	if err != nil {
		httpx.Error(w, err)
		return
	}
	updated, err := s.q.MoveTask(r.Context(), db.MoveTaskParams{
		Status:   StatusReview,
		Position: pos,
		ID:       task.ID,
		Version:  req.ExpectedVersion,
	})
	if err != nil {
		if auth.PgErrIsNoRows(err) {
			httpx.Error(w, conflict())
			return
		}
		httpx.Error(w, err)
		return
	}
	meta := map[string]any{
		"summary":        req.Summary,
		"pullRequestUrl": req.PullRequestURL,
		"commitShas":     req.CommitShas,
		"tests":          req.Tests,
	}
	_ = s.record(r.Context(), a, updated.ID, ActionReviewRequested, map[string]any{"status": task.Status}, map[string]any{"status": StatusReview}, meta)
	dto, err := s.enrich(r.Context(), updated)
	if err != nil {
		httpx.Error(w, err)
		return
	}
	httpx.JSON(w, http.StatusOK, dto, nil)
}

type completeRequest struct {
	CompletionSummary      string `json:"completionSummary"`
	AcceptanceCriteriaMet  bool   `json:"acceptanceCriteriaMet"`
	ExpectedVersion        int32  `json:"expectedVersion"`
}

func (s *Service) complete(w http.ResponseWriter, r *http.Request) {
	task, a, ok := s.loadTask(w, r, "tasks:complete")
	if !ok {
		return
	}
	if err := requireWrite(a, "tasks:complete"); err != nil {
		httpx.Error(w, err)
		return
	}
	var req completeRequest
	if err := httpx.Decode(r, &req); err != nil {
		httpx.Error(w, err)
		return
	}
	if strings.TrimSpace(req.CompletionSummary) == "" {
		httpx.Error(w, apperr.New("VALIDATION", "completion_summary is required.", http.StatusBadRequest))
		return
	}
	if !req.AcceptanceCriteriaMet {
		httpx.Error(w, apperr.New("VALIDATION", "acceptance_criteria_met must be true to complete a task.", http.StatusBadRequest))
		return
	}
	pos, err := nextPosition(r.Context(), s.q, task.OrganizationID, &task.ProjectID, StatusDone)
	if err != nil {
		httpx.Error(w, err)
		return
	}
	summary := strings.TrimSpace(req.CompletionSummary)
	updated, err := s.q.UpdateTask(r.Context(), db.UpdateTaskParams{
		ID:                task.ID,
		ExpectedVersion:   req.ExpectedVersion,
		Status:            strPtr(StatusDone),
		Position:          &pos,
		CompletionSummary: &summary,
	})
	if err != nil {
		if auth.PgErrIsNoRows(err) {
			httpx.Error(w, conflict())
			return
		}
		httpx.Error(w, err)
		return
	}
	_ = s.record(r.Context(), a, updated.ID, ActionCompleted, map[string]any{"status": task.Status}, map[string]any{"status": StatusDone, "completionSummary": summary}, nil)
	dto, err := s.enrich(r.Context(), updated)
	if err != nil {
		httpx.Error(w, err)
		return
	}
	httpx.JSON(w, http.StatusOK, dto, nil)
}

func (s *Service) archive(w http.ResponseWriter, r *http.Request) {
	task, a, ok := s.loadTask(w, r, "tasks:update")
	if !ok {
		return
	}
	if err := requireWrite(a, "tasks:update"); err != nil {
		httpx.Error(w, err)
		return
	}
	var req struct {
		ExpectedVersion int32 `json:"expectedVersion"`
	}
	if err := httpx.Decode(r, &req); err != nil {
		httpx.Error(w, err)
		return
	}
	updated, err := s.q.ArchiveTask(r.Context(), db.ArchiveTaskParams{
		ID:      task.ID,
		Version: req.ExpectedVersion,
	})
	if err != nil {
		if auth.PgErrIsNoRows(err) {
			httpx.Error(w, conflict())
			return
		}
		httpx.Error(w, err)
		return
	}
	_ = s.record(r.Context(), a, updated.ID, ActionArchived, nil, nil, nil)
	httpx.JSON(w, http.StatusOK, map[string]bool{"ok": true}, nil)
}

func (s *Service) listActivities(w http.ResponseWriter, r *http.Request) {
	task, _, ok := s.loadTask(w, r, "tasks:read")
	if !ok {
		return
	}
	rows, err := s.q.ListActivitiesByTask(r.Context(), task.ID)
	if err != nil {
		httpx.Error(w, err)
		return
	}
	out := make([]ActivityDTO, 0, len(rows))
	for _, row := range rows {
		out = append(out, activityDTO(row))
	}
	httpx.JSON(w, http.StatusOK, out, nil)
}

func (s *Service) loadTask(w http.ResponseWriter, r *http.Request, scope string) (db.Task, actor.Actor, bool) {
	a, ok := auth.RequireActor(w, r)
	if !ok {
		return db.Task{}, actor.Actor{}, false
	}
	id, err := uuid.Parse(chi.URLParam(r, "taskID"))
	if err != nil {
		httpx.Error(w, apperr.New("VALIDATION", "Invalid task id.", http.StatusBadRequest))
		return db.Task{}, a, false
	}
	task, err := s.q.GetTask(r.Context(), id)
	if err != nil {
		httpx.Error(w, apperr.New("NOT_FOUND", "Task not found.", http.StatusNotFound))
		return db.Task{}, a, false
	}
	a, _, err = s.orgs.Authorize(r.Context(), a, task.OrganizationID)
	if err != nil {
		httpx.Error(w, err)
		return db.Task{}, a, false
	}
	if a.IsAgent() && !a.HasScope(scope) && scope == "tasks:read" {
		httpx.Error(w, apperr.New("FORBIDDEN", "Missing "+scope+" scope.", http.StatusForbidden))
		return db.Task{}, a, false
	}
	return task, a, true
}

func (s *Service) enrich(ctx context.Context, t db.Task) (TaskDTO, error) {
	p, err := s.q.GetProject(ctx, t.ProjectID)
	if err != nil {
		return TaskDTO{}, err
	}
	counts, err := s.q.CountTaskComments(ctx, []uuid.UUID{t.ID})
	if err != nil {
		return TaskDTO{}, err
	}
	var n int32
	if len(counts) > 0 {
		n = counts[0].CommentCount
	}
	return dtoFrom(t, p.Key, p.Name, n), nil
}

func (s *Service) enrichMany(ctx context.Context, rows []db.Task) ([]TaskDTO, error) {
	out := make([]TaskDTO, 0, len(rows))
	if len(rows) == 0 {
		return out, nil
	}
	ids := make([]uuid.UUID, 0, len(rows))
	projects := map[uuid.UUID]db.Project{}
	for _, t := range rows {
		ids = append(ids, t.ID)
		if _, ok := projects[t.ProjectID]; !ok {
			p, err := s.q.GetProject(ctx, t.ProjectID)
			if err != nil {
				return nil, err
			}
			projects[t.ProjectID] = p
		}
	}
	countMap := map[uuid.UUID]int32{}
	counts, err := s.q.CountTaskComments(ctx, ids)
	if err != nil {
		return nil, err
	}
	for _, c := range counts {
		countMap[c.TaskID] = c.CommentCount
	}
	for _, t := range rows {
		p := projects[t.ProjectID]
		out = append(out, dtoFrom(t, p.Key, p.Name, countMap[t.ID]))
	}
	return out, nil
}

func (s *Service) record(ctx context.Context, a actor.Actor, taskID uuid.UUID, action string, oldV, newV, meta any) error {
	var oldB, newB, metaB []byte
	if oldV != nil {
		oldB = jsonVal(oldV)
	}
	if newV != nil {
		newB = jsonVal(newV)
	}
	if meta != nil {
		metaB = jsonVal(meta)
	} else {
		metaB = []byte(`{}`)
	}
	_, err := s.q.CreateActivity(ctx, db.CreateActivityParams{
		TaskID:    taskID,
		ActorType: string(a.Type),
		ActorID:   &a.ID,
		Action:    action,
		OldValue:  oldB,
		NewValue:  newB,
		Metadata:  metaB,
	})
	return err
}

func (s *Service) maybeNormalize(ctx context.Context, projectID uuid.UUID, status string) error {
	rows, err := s.q.ListTaskPositionsInColumn(ctx, db.ListTaskPositionsInColumnParams{
		ProjectID: projectID,
		Status:    status,
	})
	if err != nil {
		return err
	}
	for i := 1; i < len(rows); i++ {
		if shouldNormalize(rows[i-1].Position, rows[i].Position) {
			return s.q.NormalizeTaskPositions(ctx, db.NormalizeTaskPositionsParams{
				ProjectID: projectID,
				Status:    status,
			})
		}
	}
	return nil
}

func commentDTO(c db.TaskComment) CommentDTO {
	meta := json.RawMessage(c.Metadata)
	if len(meta) == 0 {
		meta = json.RawMessage(`{}`)
	}
	return CommentDTO{
		ID:         c.ID,
		TaskID:     c.TaskID,
		AuthorType: c.AuthorType,
		AuthorID:   c.AuthorID,
		Content:    c.Content,
		Metadata:   meta,
		CreatedAt:  c.CreatedAt.Time,
	}
}

func activityDTO(a db.TaskActivity) ActivityDTO {
	meta := json.RawMessage(a.Metadata)
	if len(meta) == 0 {
		meta = json.RawMessage(`{}`)
	}
	return ActivityDTO{
		ID:        a.ID,
		TaskID:    a.TaskID,
		ActorType: a.ActorType,
		ActorID:   a.ActorID,
		Action:    a.Action,
		OldValue:  json.RawMessage(a.OldValue),
		NewValue:  json.RawMessage(a.NewValue),
		Metadata:  meta,
		CreatedAt: a.CreatedAt.Time,
	}
}

func emptyToNil(s *string) *string {
	if s == nil || strings.TrimSpace(*s) == "" {
		return nil
	}
	v := strings.TrimSpace(*s)
	return &v
}

func boolPtr(b bool) *bool { return &b }

func strPtr(s string) *string { return &s }
