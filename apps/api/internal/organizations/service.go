package organizations

import (
	"context"
	"net/http"
	"regexp"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/team-ops/api/internal/actor"
	"github.com/team-ops/api/internal/apperr"
	"github.com/team-ops/api/internal/auth"
	"github.com/team-ops/api/internal/db"
	"github.com/team-ops/api/platform/database"
	httpx "github.com/team-ops/api/platform/http"
)

var slugRe = regexp.MustCompile(`^[a-z0-9]+(?:-[a-z0-9]+)*$`)

type Service struct {
	q *db.Queries
}

func New(pool *pgxpool.Pool) *Service {
	return &Service{q: db.New(pool)}
}

type orgDTO struct {
	ID        uuid.UUID `json:"id"`
	Name      string    `json:"name"`
	Slug      string    `json:"slug"`
	Color     *string   `json:"color"`
	Role      string    `json:"role,omitempty"`
	CreatedAt time.Time `json:"createdAt"`
}

type memberDTO struct {
	UserID    uuid.UUID `json:"userId"`
	Name      string    `json:"name"`
	Email     string    `json:"email"`
	AvatarURL *string   `json:"avatarUrl"`
	Role      string    `json:"role"`
	CreatedAt time.Time `json:"createdAt"`
}

func (s *Service) Routes() chi.Router {
	r := chi.NewRouter()
	r.Get("/", s.list)
	r.Post("/", s.create)
	r.Get("/{orgID}", s.get)
	r.Patch("/{orgID}", s.update)
	r.Get("/{orgID}/members", s.listMembers)
	r.Post("/{orgID}/members", s.addMember)
	r.Patch("/{orgID}/members/{userID}", s.updateMember)
	r.Delete("/{orgID}/members/{userID}", s.removeMember)
	return r
}

func (s *Service) list(w http.ResponseWriter, r *http.Request) {
	a, ok := auth.RequireActor(w, r)
	if !ok {
		return
	}
	if a.IsAgent() {
		if a.OrganizationID == nil {
			httpx.JSON(w, http.StatusOK, []orgDTO{}, nil)
			return
		}
		org, err := s.q.GetOrganization(r.Context(), *a.OrganizationID)
		if err != nil {
			httpx.JSON(w, http.StatusOK, []orgDTO{}, nil)
			return
		}
		httpx.JSON(w, http.StatusOK, []orgDTO{orgDTOFrom(org, string(a.Role))}, nil)
		return
	}
	rows, err := s.q.ListOrganizationsForUser(r.Context(), a.ID)
	if err != nil {
		httpx.Error(w, err)
		return
	}
	out := make([]orgDTO, 0, len(rows))
	for _, org := range rows {
		role := ""
		if m, err := s.q.GetOrganizationMember(r.Context(), db.GetOrganizationMemberParams{
			OrganizationID: org.ID,
			UserID:         a.ID,
		}); err == nil {
			role = m.Role
		}
		out = append(out, orgDTOFrom(org, role))
	}
	httpx.JSON(w, http.StatusOK, out, nil)
}

type createOrgRequest struct {
	Name  string  `json:"name"`
	Slug  string  `json:"slug"`
	Color *string `json:"color"`
}

func (s *Service) create(w http.ResponseWriter, r *http.Request) {
	a, ok := auth.RequireActor(w, r)
	if !ok {
		return
	}
	if !a.IsUser() {
		httpx.Error(w, apperr.New("FORBIDDEN", "Agents cannot create organizations.", http.StatusForbidden))
		return
	}
	var req createOrgRequest
	if err := httpx.Decode(r, &req); err != nil {
		httpx.Error(w, err)
		return
	}
	req.Name = strings.TrimSpace(req.Name)
	req.Slug = strings.ToLower(strings.TrimSpace(req.Slug))
	if req.Name == "" || !slugRe.MatchString(req.Slug) {
		httpx.Error(w, apperr.New("VALIDATION", "A name and a lowercase slug (e.g. acme-corp) are required.", http.StatusBadRequest))
		return
	}
	org, err := s.q.CreateOrganization(r.Context(), db.CreateOrganizationParams{
		Name:  req.Name,
		Slug:  req.Slug,
		Color: req.Color,
	})
	if err != nil {
		if database.IsUniqueViolation(err) {
			httpx.Error(w, apperr.New("SLUG_TAKEN", "That organization slug is already in use.", http.StatusConflict))
			return
		}
		httpx.Error(w, err)
		return
	}
	_, err = s.q.AddOrganizationMember(r.Context(), db.AddOrganizationMemberParams{
		OrganizationID: org.ID,
		UserID:         a.ID,
		Role:           string(actor.RoleAdmin),
	})
	if err != nil {
		httpx.Error(w, err)
		return
	}
	httpx.JSON(w, http.StatusCreated, orgDTOFrom(org, string(actor.RoleAdmin)), nil)
}

func (s *Service) get(w http.ResponseWriter, r *http.Request) {
	a, org, ok := s.requireMember(w, r)
	if !ok {
		return
	}
	httpx.JSON(w, http.StatusOK, orgDTOFrom(org, string(a.Role)), nil)
}

func (s *Service) update(w http.ResponseWriter, r *http.Request) {
	a, org, ok := s.requireMember(w, r)
	if !ok {
		return
	}
	if !a.CanManageOrg() {
		httpx.Error(w, apperr.New("FORBIDDEN", "Only admins can update the organization.", http.StatusForbidden))
		return
	}
	var req createOrgRequest
	if err := httpx.Decode(r, &req); err != nil {
		httpx.Error(w, err)
		return
	}
	updated, err := s.q.UpdateOrganization(r.Context(), db.UpdateOrganizationParams{
		ID:    org.ID,
		Name:  strPtr(strings.TrimSpace(req.Name)),
		Color: req.Color,
	})
	if err != nil {
		httpx.Error(w, err)
		return
	}
	httpx.JSON(w, http.StatusOK, orgDTOFrom(updated, string(a.Role)), nil)
}

func (s *Service) listMembers(w http.ResponseWriter, r *http.Request) {
	_, org, ok := s.requireMember(w, r)
	if !ok {
		return
	}
	rows, err := s.q.ListOrganizationMembers(r.Context(), org.ID)
	if err != nil {
		httpx.Error(w, err)
		return
	}
	out := make([]memberDTO, 0, len(rows))
	for _, m := range rows {
		out = append(out, memberDTO{
			UserID:    m.UserID,
			Name:      m.UserName,
			Email:     m.UserEmail,
			AvatarURL: m.UserAvatarUrl,
			Role:      m.Role,
			CreatedAt: m.CreatedAt.Time,
		})
	}
	httpx.JSON(w, http.StatusOK, out, nil)
}

type memberRequest struct {
	Email string `json:"email"`
	Role  string `json:"role"`
}

func (s *Service) addMember(w http.ResponseWriter, r *http.Request) {
	a, org, ok := s.requireMember(w, r)
	if !ok {
		return
	}
	if !a.CanManageOrg() {
		httpx.Error(w, apperr.New("FORBIDDEN", "Only admins can manage members.", http.StatusForbidden))
		return
	}
	var req memberRequest
	if err := httpx.Decode(r, &req); err != nil {
		httpx.Error(w, err)
		return
	}
	if !validRole(req.Role) {
		httpx.Error(w, apperr.New("VALIDATION", "Role must be admin, developer, or viewer.", http.StatusBadRequest))
		return
	}
	user, err := s.q.GetUserByEmail(r.Context(), strings.ToLower(strings.TrimSpace(req.Email)))
	if err != nil {
		httpx.Error(w, apperr.New("NOT_FOUND", "No user with that email exists.", http.StatusNotFound))
		return
	}
	m, err := s.q.AddOrganizationMember(r.Context(), db.AddOrganizationMemberParams{
		OrganizationID: org.ID,
		UserID:         user.ID,
		Role:           req.Role,
	})
	if err != nil {
		if database.IsUniqueViolation(err) {
			httpx.Error(w, apperr.New("ALREADY_MEMBER", "That user is already a member.", http.StatusConflict))
			return
		}
		httpx.Error(w, err)
		return
	}
	httpx.JSON(w, http.StatusCreated, memberDTO{
		UserID:    user.ID,
		Name:      user.Name,
		Email:     user.Email,
		AvatarURL: user.AvatarUrl,
		Role:      m.Role,
		CreatedAt: m.CreatedAt.Time,
	}, nil)
}

func (s *Service) updateMember(w http.ResponseWriter, r *http.Request) {
	a, org, ok := s.requireMember(w, r)
	if !ok {
		return
	}
	if !a.CanManageOrg() {
		httpx.Error(w, apperr.New("FORBIDDEN", "Only admins can manage members.", http.StatusForbidden))
		return
	}
	userID, err := uuid.Parse(chi.URLParam(r, "userID"))
	if err != nil {
		httpx.Error(w, apperr.New("VALIDATION", "Invalid user id.", http.StatusBadRequest))
		return
	}
	var req memberRequest
	if err := httpx.Decode(r, &req); err != nil {
		httpx.Error(w, err)
		return
	}
	if !validRole(req.Role) {
		httpx.Error(w, apperr.New("VALIDATION", "Role must be admin, developer, or viewer.", http.StatusBadRequest))
		return
	}
	_, err = s.q.UpdateOrganizationMemberRole(r.Context(), db.UpdateOrganizationMemberRoleParams{
		OrganizationID: org.ID,
		UserID:         userID,
		Role:           req.Role,
	})
	if err != nil {
		httpx.Error(w, err)
		return
	}
	httpx.JSON(w, http.StatusOK, map[string]string{"role": req.Role}, nil)
}

func (s *Service) removeMember(w http.ResponseWriter, r *http.Request) {
	a, org, ok := s.requireMember(w, r)
	if !ok {
		return
	}
	if !a.CanManageOrg() {
		httpx.Error(w, apperr.New("FORBIDDEN", "Only admins can manage members.", http.StatusForbidden))
		return
	}
	userID, err := uuid.Parse(chi.URLParam(r, "userID"))
	if err != nil {
		httpx.Error(w, apperr.New("VALIDATION", "Invalid user id.", http.StatusBadRequest))
		return
	}
	if err := s.q.RemoveOrganizationMember(r.Context(), db.RemoveOrganizationMemberParams{
		OrganizationID: org.ID,
		UserID:         userID,
	}); err != nil {
		httpx.Error(w, err)
		return
	}
	httpx.JSON(w, http.StatusOK, map[string]bool{"ok": true}, nil)
}

func (s *Service) requireMember(w http.ResponseWriter, r *http.Request) (actor.Actor, db.Organization, bool) {
	a, ok := auth.RequireActor(w, r)
	if !ok {
		return actor.Actor{}, db.Organization{}, false
	}
	orgID, err := uuid.Parse(chi.URLParam(r, "orgID"))
	if err != nil {
		httpx.Error(w, apperr.New("VALIDATION", "Invalid organization id.", http.StatusBadRequest))
		return actor.Actor{}, db.Organization{}, false
	}
	a, org, err := s.Authorize(r.Context(), a, orgID)
	if err != nil {
		httpx.Error(w, err)
		return actor.Actor{}, db.Organization{}, false
	}
	return a, org, true
}

func (s *Service) Authorize(ctx context.Context, a actor.Actor, orgID uuid.UUID) (actor.Actor, db.Organization, error) {
	org, err := s.q.GetOrganization(ctx, orgID)
	if err != nil {
		return a, db.Organization{}, apperr.New("NOT_FOUND", "Organization not found.", http.StatusNotFound)
	}
	if a.IsAgent() {
		if a.OrganizationID == nil || *a.OrganizationID != orgID {
			return a, org, apperr.New("FORBIDDEN", "This agent cannot access that organization.", http.StatusForbidden)
		}
		return a, org, nil
	}
	m, err := s.q.GetOrganizationMember(ctx, db.GetOrganizationMemberParams{
		OrganizationID: orgID,
		UserID:         a.ID,
	})
	if err != nil {
		return a, org, apperr.New("FORBIDDEN", "You are not a member of this organization.", http.StatusForbidden)
	}
	a.OrganizationID = &orgID
	a.Role = actor.Role(m.Role)
	return a, org, nil
}

func orgDTOFrom(o db.Organization, role string) orgDTO {
	return orgDTO{
		ID:        o.ID,
		Name:      o.Name,
		Slug:      o.Slug,
		Color:     o.Color,
		Role:      role,
		CreatedAt: o.CreatedAt.Time,
	}
}

func validRole(role string) bool {
	return role == "admin" || role == "developer" || role == "viewer"
}

func strPtr(s string) *string {
	if s == "" {
		return nil
	}
	return &s
}
