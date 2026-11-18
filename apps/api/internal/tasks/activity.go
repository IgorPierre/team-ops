package tasks

import (
	"net/http"
	"strconv"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"

	"github.com/team-ops/api/internal/apperr"
	"github.com/team-ops/api/internal/auth"
	"github.com/team-ops/api/internal/db"
	httpx "github.com/team-ops/api/platform/http"
)

const (
	defaultActivityDays  = 371
	maxActivityDays      = 731
	defaultActivityLimit = 5000
	maxActivityLimit     = 20000
)

// OrgActivityDTO is one entry of the organization-wide activity feed. It is
// slimmer than ActivityDTO: the feed powers contribution charts, which only
// need who did what, on which task, and when.
type OrgActivityDTO struct {
	ID        uuid.UUID  `json:"id"`
	TaskID    uuid.UUID  `json:"taskId"`
	TaskKey   string     `json:"taskKey"`
	TaskTitle string     `json:"taskTitle"`
	ProjectID uuid.UUID  `json:"projectId"`
	ActorType string     `json:"actorType"`
	ActorID   *uuid.UUID `json:"actorId"`
	Action    string     `json:"action"`
	CreatedAt time.Time  `json:"createdAt"`
}

// listOrgActivity serves GET /v1/tasks/activity?organizationId=…[&projectId=…][&actorId=…[&includeAgents=true]][&days=…][&limit=…]
func (s *Service) listOrgActivity(w http.ResponseWriter, r *http.Request) {
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

	days := boundedInt(q.Get("days"), defaultActivityDays, 1, maxActivityDays)
	limit := boundedInt(q.Get("limit"), defaultActivityLimit, 1, maxActivityLimit)
	params := db.ListOrganizationActivitiesParams{
		OrganizationID: orgID,
		Since:          pgtype.Timestamptz{Time: time.Now().AddDate(0, 0, -days), Valid: true},
		RowLimit:       int32(limit),
	}
	for key, dst := range map[string]**uuid.UUID{"projectId": &params.ProjectID, "actorId": &params.ActorID} {
		v := q.Get(key)
		if v == "" {
			continue
		}
		id, err := uuid.Parse(v)
		if err != nil {
			httpx.Error(w, apperr.New("VALIDATION", "Invalid "+key+".", http.StatusBadRequest))
			return
		}
		*dst = &id
	}

	// includeAgents=true widens actorId to the coding agents that person owns.
	params.IncludeOwnedAgents = q.Get("includeAgents") == "true"

	rows, err := s.q.ListOrganizationActivities(r.Context(), params)
	if err != nil {
		httpx.Error(w, err)
		return
	}
	out := make([]OrgActivityDTO, 0, len(rows))
	for _, row := range rows {
		out = append(out, OrgActivityDTO{
			ID:        row.ID,
			TaskID:    row.TaskID,
			TaskKey:   row.ProjectKey + "-" + itoa(row.TaskNumber),
			TaskTitle: row.TaskTitle,
			ProjectID: row.ProjectID,
			ActorType: row.ActorType,
			ActorID:   row.ActorID,
			Action:    row.Action,
			CreatedAt: row.CreatedAt.Time,
		})
	}
	httpx.JSON(w, http.StatusOK, out, nil)
}

func boundedInt(raw string, fallback, lo, hi int) int {
	n, err := strconv.Atoi(raw)
	if err != nil {
		return fallback
	}
	if n < lo {
		return lo
	}
	if n > hi {
		return hi
	}
	return n
}
