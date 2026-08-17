package agents

import (
	"net/http"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/team-ops/api/internal/apperr"
	"github.com/team-ops/api/internal/auth"
	"github.com/team-ops/api/internal/db"
	"github.com/team-ops/api/internal/organizations"
	httpx "github.com/team-ops/api/platform/http"
)

var defaultScopes = []string{
	"tasks:read",
	"tasks:create",
	"tasks:update",
	"tasks:move",
	"tasks:comment",
	"tasks:complete",
	"projects:read",
	"organizations:read",
}

type Service struct {
	q    *db.Queries
	orgs *organizations.Service
}

func New(pool *pgxpool.Pool, orgs *organizations.Service) *Service {
	return &Service{q: db.New(pool), orgs: orgs}
}

type agentDTO struct {
	ID             uuid.UUID  `json:"id"`
	Name           string     `json:"name"`
	DeveloperID    *uuid.UUID `json:"developerId"`
	OrganizationID *uuid.UUID `json:"organizationId"`
	Description    *string    `json:"description"`
	Active         bool       `json:"active"`
	LastSeenAt     *time.Time `json:"lastSeenAt"`
	CreatedAt      time.Time  `json:"createdAt"`
}

type apiKeyDTO struct {
	ID         uuid.UUID  `json:"id"`
	AgentID    uuid.UUID  `json:"agentId"`
	Name       string     `json:"name"`
	Prefix     string     `json:"prefix"`
	Scopes     []string   `json:"scopes"`
	ExpiresAt  *time.Time `json:"expiresAt"`
	LastUsedAt *time.Time `json:"lastUsedAt"`
	RevokedAt  *time.Time `json:"revokedAt"`
	CreatedAt  time.Time  `json:"createdAt"`
	Key        string     `json:"key,omitempty"`
}

func (s *Service) Routes() chi.Router {
	r := chi.NewRouter()
	r.Get("/", s.list)
	r.Post("/", s.create)
	r.Get("/{agentID}", s.get)
	r.Patch("/{agentID}", s.update)
	r.Get("/{agentID}/api-keys", s.listKeys)
	r.Post("/{agentID}/api-keys", s.createKey)
	r.Delete("/{agentID}/api-keys/{keyID}", s.revokeKey)
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
	rows, err := s.q.ListAgentsByOrganization(r.Context(), &orgID)
	if err != nil {
		httpx.Error(w, err)
		return
	}
	out := make([]agentDTO, 0, len(rows))
	for _, ag := range rows {
		out = append(out, agentFrom(ag))
	}
	httpx.JSON(w, http.StatusOK, out, nil)
}

type createAgentRequest struct {
	OrganizationID uuid.UUID `json:"organizationId"`
	Name           string    `json:"name"`
	Description    *string   `json:"description"`
}

func (s *Service) create(w http.ResponseWriter, r *http.Request) {
	a, ok := auth.RequireActor(w, r)
	if !ok {
		return
	}
	var req createAgentRequest
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
		httpx.Error(w, apperr.New("FORBIDDEN", "Only admins can manage agents.", http.StatusForbidden))
		return
	}
	req.Name = strings.TrimSpace(req.Name)
	if req.Name == "" {
		httpx.Error(w, apperr.New("VALIDATION", "Name is required.", http.StatusBadRequest))
		return
	}
	ag, err := s.q.CreateAgent(r.Context(), db.CreateAgentParams{
		Name:           req.Name,
		DeveloperID:    &a.ID,
		OrganizationID: &req.OrganizationID,
		Description:    req.Description,
	})
	if err != nil {
		httpx.Error(w, err)
		return
	}
	httpx.JSON(w, http.StatusCreated, agentFrom(ag), nil)
}

func (s *Service) get(w http.ResponseWriter, r *http.Request) {
	ag, ok := s.loadAgent(w, r)
	if !ok {
		return
	}
	httpx.JSON(w, http.StatusOK, agentFrom(ag), nil)
}

func (s *Service) update(w http.ResponseWriter, r *http.Request) {
	a, ok := auth.RequireActor(w, r)
	if !ok {
		return
	}
	ag, ok := s.loadAgent(w, r)
	if !ok {
		return
	}
	if ag.OrganizationID != nil {
		a, _, err := s.orgs.Authorize(r.Context(), a, *ag.OrganizationID)
		if err != nil {
			httpx.Error(w, err)
			return
		}
		if !a.CanManageOrg() {
			httpx.Error(w, apperr.New("FORBIDDEN", "Only admins can manage agents.", http.StatusForbidden))
			return
		}
	}
	var req createAgentRequest
	if err := httpx.Decode(r, &req); err != nil {
		httpx.Error(w, err)
		return
	}
	updated, err := s.q.UpdateAgent(r.Context(), db.UpdateAgentParams{
		ID:          ag.ID,
		Name:        strPtr(strings.TrimSpace(req.Name)),
		Description: req.Description,
	})
	if err != nil {
		httpx.Error(w, err)
		return
	}
	httpx.JSON(w, http.StatusOK, agentFrom(updated), nil)
}

type createKeyRequest struct {
	Name      string     `json:"name"`
	Scopes    []string   `json:"scopes"`
	ExpiresAt *time.Time `json:"expiresAt"`
}

func (s *Service) createKey(w http.ResponseWriter, r *http.Request) {
	a, ok := auth.RequireActor(w, r)
	if !ok {
		return
	}
	ag, ok := s.loadAgent(w, r)
	if !ok {
		return
	}
	if ag.OrganizationID == nil {
		httpx.Error(w, apperr.New("VALIDATION", "Agent is missing an organization.", http.StatusBadRequest))
		return
	}
	a, _, err := s.orgs.Authorize(r.Context(), a, *ag.OrganizationID)
	if err != nil {
		httpx.Error(w, err)
		return
	}
	if !a.CanManageOrg() {
		httpx.Error(w, apperr.New("FORBIDDEN", "Only admins can create API keys.", http.StatusForbidden))
		return
	}
	var req createKeyRequest
	if err := httpx.Decode(r, &req); err != nil {
		httpx.Error(w, err)
		return
	}
	if req.Name == "" {
		req.Name = "default"
	}
	scopes := req.Scopes
	if len(scopes) == 0 {
		scopes = defaultScopes
	}
	raw, prefix, hash, err := auth.NewAPIKey()
	if err != nil {
		httpx.Error(w, err)
		return
	}
	var exp pgtype.Timestamptz
	if req.ExpiresAt != nil {
		exp = pgtype.Timestamptz{Time: *req.ExpiresAt, Valid: true}
	}
	key, err := s.q.CreateAPIKey(r.Context(), db.CreateAPIKeyParams{
		AgentID:   ag.ID,
		Name:      req.Name,
		Prefix:    prefix,
		KeyHash:   hash,
		Scopes:    scopes,
		ExpiresAt: exp,
	})
	if err != nil {
		httpx.Error(w, err)
		return
	}
	dto := keyFrom(key)
	dto.Key = raw
	httpx.JSON(w, http.StatusCreated, dto, nil)
}

func (s *Service) listKeys(w http.ResponseWriter, r *http.Request) {
	ag, ok := s.loadAgent(w, r)
	if !ok {
		return
	}
	rows, err := s.q.ListAPIKeysByAgent(r.Context(), ag.ID)
	if err != nil {
		httpx.Error(w, err)
		return
	}
	out := make([]apiKeyDTO, 0, len(rows))
	for _, k := range rows {
		out = append(out, keyFrom(k))
	}
	httpx.JSON(w, http.StatusOK, out, nil)
}

func (s *Service) revokeKey(w http.ResponseWriter, r *http.Request) {
	a, ok := auth.RequireActor(w, r)
	if !ok {
		return
	}
	ag, ok := s.loadAgent(w, r)
	if !ok {
		return
	}
	if ag.OrganizationID != nil {
		a, _, err := s.orgs.Authorize(r.Context(), a, *ag.OrganizationID)
		if err != nil {
			httpx.Error(w, err)
			return
		}
		if !a.CanManageOrg() {
			httpx.Error(w, apperr.New("FORBIDDEN", "Only admins can revoke API keys.", http.StatusForbidden))
			return
		}
	}
	keyID, err := uuid.Parse(chi.URLParam(r, "keyID"))
	if err != nil {
		httpx.Error(w, apperr.New("VALIDATION", "Invalid key id.", http.StatusBadRequest))
		return
	}
	if _, err := s.q.RevokeAPIKey(r.Context(), keyID); err != nil {
		httpx.Error(w, apperr.New("NOT_FOUND", "API key not found.", http.StatusNotFound))
		return
	}
	httpx.JSON(w, http.StatusOK, map[string]bool{"ok": true}, nil)
}

func (s *Service) loadAgent(w http.ResponseWriter, r *http.Request) (db.Agent, bool) {
	a, ok := auth.RequireActor(w, r)
	if !ok {
		return db.Agent{}, false
	}
	id, err := uuid.Parse(chi.URLParam(r, "agentID"))
	if err != nil {
		httpx.Error(w, apperr.New("VALIDATION", "Invalid agent id.", http.StatusBadRequest))
		return db.Agent{}, false
	}
	ag, err := s.q.GetAgent(r.Context(), id)
	if err != nil {
		httpx.Error(w, apperr.New("NOT_FOUND", "Agent not found.", http.StatusNotFound))
		return db.Agent{}, false
	}
	if ag.OrganizationID != nil {
		if _, _, err := s.orgs.Authorize(r.Context(), a, *ag.OrganizationID); err != nil {
			httpx.Error(w, err)
			return db.Agent{}, false
		}
	}
	return ag, true
}

func agentFrom(a db.Agent) agentDTO {
	var last *time.Time
	if a.LastSeenAt.Valid {
		t := a.LastSeenAt.Time
		last = &t
	}
	return agentDTO{
		ID:             a.ID,
		Name:           a.Name,
		DeveloperID:    a.DeveloperID,
		OrganizationID: a.OrganizationID,
		Description:    a.Description,
		Active:         a.Active,
		LastSeenAt:     last,
		CreatedAt:      a.CreatedAt.Time,
	}
}

func keyFrom(k db.ApiKey) apiKeyDTO {
	dto := apiKeyDTO{
		ID:        k.ID,
		AgentID:   k.AgentID,
		Name:      k.Name,
		Prefix:    k.Prefix,
		Scopes:    k.Scopes,
		CreatedAt: k.CreatedAt.Time,
	}
	if k.ExpiresAt.Valid {
		t := k.ExpiresAt.Time
		dto.ExpiresAt = &t
	}
	if k.LastUsedAt.Valid {
		t := k.LastUsedAt.Time
		dto.LastUsedAt = &t
	}
	if k.RevokedAt.Valid {
		t := k.RevokedAt.Time
		dto.RevokedAt = &t
	}
	return dto
}

func strPtr(s string) *string {
	if s == "" {
		return nil
	}
	return &s
}
