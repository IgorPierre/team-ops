package projects

import (
	"net/http"
	"regexp"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/team-ops/api/internal/apperr"
	"github.com/team-ops/api/internal/auth"
	"github.com/team-ops/api/internal/db"
	"github.com/team-ops/api/internal/organizations"
	"github.com/team-ops/api/platform/database"
	httpx "github.com/team-ops/api/platform/http"
)

var keyRe = regexp.MustCompile(`^[A-Z][A-Z0-9]{1,9}$`)

type Service struct {
	q    *db.Queries
	orgs *organizations.Service
}

func New(pool *pgxpool.Pool, orgs *organizations.Service) *Service {
	return &Service{q: db.New(pool), orgs: orgs}
}

type projectDTO struct {
	ID             uuid.UUID `json:"id"`
	OrganizationID uuid.UUID `json:"organizationId"`
	Name           string    `json:"name"`
	Key            string    `json:"key"`
	Description    string    `json:"description"`
	CreatedAt      time.Time `json:"createdAt"`
}

func (s *Service) Routes() chi.Router {
	r := chi.NewRouter()
	r.Get("/", s.list)
	r.Post("/", s.create)
	r.Get("/{projectID}", s.get)
	r.Patch("/{projectID}", s.update)
	return r
}

func (s *Service) list(w http.ResponseWriter, r *http.Request) {
	a, ok := auth.RequireActor(w, r)
	if !ok {
		return
	}
	orgID, err := uuid.Parse(r.URL.Query().Get("organizationId"))
	if err != nil {
		httpx.Error(w, apperr.New("VALIDATION", "organizationId is required.", http.StatusBadRequest))
		return
	}
	a, _, err = s.orgs.Authorize(r.Context(), a, orgID)
	if err != nil {
		httpx.Error(w, err)
		return
	}
	if a.IsAgent() && !a.HasScope("projects:read") && !a.HasScope("tasks:read") {
		httpx.Error(w, apperr.New("FORBIDDEN", "Missing projects:read scope.", http.StatusForbidden))
		return
	}
	rows, err := s.q.ListProjectsByOrganization(r.Context(), orgID)
	if err != nil {
		httpx.Error(w, err)
		return
	}
	out := make([]projectDTO, 0, len(rows))
	for _, p := range rows {
		out = append(out, projectDTOFrom(p))
	}
	httpx.JSON(w, http.StatusOK, out, nil)
}

type createProjectRequest struct {
	OrganizationID uuid.UUID `json:"organizationId"`
	Name           string    `json:"name"`
	Key            string    `json:"key"`
	Description    string    `json:"description"`
}

func (s *Service) create(w http.ResponseWriter, r *http.Request) {
	a, ok := auth.RequireActor(w, r)
	if !ok {
		return
	}
	var req createProjectRequest
	if err := httpx.Decode(r, &req); err != nil {
		httpx.Error(w, err)
		return
	}
	a, _, err := s.orgs.Authorize(r.Context(), a, req.OrganizationID)
	if err != nil {
		httpx.Error(w, err)
		return
	}
	if !a.CanManageOrg() {
		httpx.Error(w, apperr.New("FORBIDDEN", "Only admins can create projects.", http.StatusForbidden))
		return
	}
	req.Name = strings.TrimSpace(req.Name)
	req.Key = strings.ToUpper(strings.TrimSpace(req.Key))
	if req.Name == "" || !keyRe.MatchString(req.Key) {
		httpx.Error(w, apperr.New("VALIDATION", "Name and a project key like ERP or SITE are required.", http.StatusBadRequest))
		return
	}
	p, err := s.q.CreateProject(r.Context(), db.CreateProjectParams{
		OrganizationID: req.OrganizationID,
		Name:           req.Name,
		Key:            req.Key,
		Description:    req.Description,
	})
	if err != nil {
		if database.IsUniqueViolation(err) {
			httpx.Error(w, apperr.New("KEY_TAKEN", "That project key is already used in this organization.", http.StatusConflict))
			return
		}
		httpx.Error(w, err)
		return
	}
	httpx.JSON(w, http.StatusCreated, projectDTOFrom(p), nil)
}

func (s *Service) get(w http.ResponseWriter, r *http.Request) {
	p, err := s.loadAuthorized(w, r)
	if err != nil {
		return
	}
	httpx.JSON(w, http.StatusOK, projectDTOFrom(p), nil)
}

func (s *Service) update(w http.ResponseWriter, r *http.Request) {
	a, ok := auth.RequireActor(w, r)
	if !ok {
		return
	}
	p, err := s.loadAuthorized(w, r)
	if err != nil {
		return
	}
	a, _, err = s.orgs.Authorize(r.Context(), a, p.OrganizationID)
	if err != nil {
		httpx.Error(w, err)
		return
	}
	if !a.CanManageOrg() {
		httpx.Error(w, apperr.New("FORBIDDEN", "Only admins can update projects.", http.StatusForbidden))
		return
	}
	var req createProjectRequest
	if err := httpx.Decode(r, &req); err != nil {
		httpx.Error(w, err)
		return
	}
	updated, err := s.q.UpdateProject(r.Context(), db.UpdateProjectParams{
		ID:          p.ID,
		Name:        strPtr(strings.TrimSpace(req.Name)),
		Description: strPtr(req.Description),
	})
	if err != nil {
		httpx.Error(w, err)
		return
	}
	httpx.JSON(w, http.StatusOK, projectDTOFrom(updated), nil)
}

func (s *Service) loadAuthorized(w http.ResponseWriter, r *http.Request) (db.Project, error) {
	a, ok := auth.RequireActor(w, r)
	if !ok {
		return db.Project{}, apperr.New("UNAUTHENTICATED", "Authentication required.", http.StatusUnauthorized)
	}
	id, err := uuid.Parse(chi.URLParam(r, "projectID"))
	if err != nil {
		httpx.Error(w, apperr.New("VALIDATION", "Invalid project id.", http.StatusBadRequest))
		return db.Project{}, err
	}
	p, err := s.q.GetProject(r.Context(), id)
	if err != nil {
		httpx.Error(w, apperr.New("NOT_FOUND", "Project not found.", http.StatusNotFound))
		return db.Project{}, err
	}
	if _, _, err := s.orgs.Authorize(r.Context(), a, p.OrganizationID); err != nil {
		httpx.Error(w, err)
		return db.Project{}, err
	}
	return p, nil
}

func projectDTOFrom(p db.Project) projectDTO {
	return projectDTO{
		ID:             p.ID,
		OrganizationID: p.OrganizationID,
		Name:           p.Name,
		Key:            p.Key,
		Description:    p.Description,
		CreatedAt:      p.CreatedAt.Time,
	}
}

func strPtr(s string) *string {
	if s == "" {
		return nil
	}
	return &s
}
