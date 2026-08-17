package auth

import (
	"context"
	"errors"
	"log/slog"
	"net/http"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/team-ops/api/internal/actor"
	"github.com/team-ops/api/internal/apperr"
	"github.com/team-ops/api/internal/db"
	httpx "github.com/team-ops/api/platform/http"
)

type Service struct {
	q          *db.Queries
	pool       *pgxpool.Pool
	cookieName string
	secure     bool
	ttl        time.Duration
	log        *slog.Logger
}

func NewService(pool *pgxpool.Pool, cookieName string, secure bool, ttl time.Duration, log *slog.Logger) *Service {
	return &Service{
		q:          db.New(pool),
		pool:       pool,
		cookieName: cookieName,
		secure:     secure,
		ttl:        ttl,
		log:        log,
	}
}

type registerRequest struct {
	Name     string `json:"name"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

type loginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type userDTO struct {
	ID        uuid.UUID `json:"id"`
	Name      string    `json:"name"`
	Email     string    `json:"email"`
	AvatarURL *string   `json:"avatarUrl"`
	CreatedAt time.Time `json:"createdAt"`
}

func (s *Service) Routes() chi.Router {
	r := chi.NewRouter()
	r.Post("/register", s.handleRegister)
	r.Post("/login", s.handleLogin)
	r.Post("/logout", s.handleLogout)
	r.Get("/me", s.handleMe)
	return r
}

func (s *Service) handleRegister(w http.ResponseWriter, r *http.Request) {
	var req registerRequest
	if err := httpx.Decode(r, &req); err != nil {
		httpx.Error(w, err)
		return
	}
	req.Name = strings.TrimSpace(req.Name)
	req.Email = strings.ToLower(strings.TrimSpace(req.Email))
	if req.Name == "" || req.Email == "" || len(req.Password) < 8 {
		httpx.Error(w, apperr.New("VALIDATION", "Name, email, and a password of at least 8 characters are required.", http.StatusBadRequest))
		return
	}
	hash, err := HashPassword(req.Password)
	if err != nil {
		httpx.Error(w, err)
		return
	}
	user, err := s.q.CreateUser(r.Context(), db.CreateUserParams{
		Name:         req.Name,
		Email:        req.Email,
		PasswordHash: hash,
		AvatarUrl:    nil,
	})
	if err != nil {
		if isUniqueViolation(err) {
			httpx.Error(w, apperr.New("EMAIL_TAKEN", "An account with this email already exists.", http.StatusConflict))
			return
		}
		httpx.Error(w, err)
		return
	}
	if err := s.issueSession(w, r, user.ID); err != nil {
		httpx.Error(w, err)
		return
	}
	httpx.JSON(w, http.StatusCreated, userDTOFrom(user), nil)
}

func (s *Service) handleLogin(w http.ResponseWriter, r *http.Request) {
	var req loginRequest
	if err := httpx.Decode(r, &req); err != nil {
		httpx.Error(w, err)
		return
	}
	user, err := s.q.GetUserByEmail(r.Context(), strings.ToLower(strings.TrimSpace(req.Email)))
	if err != nil {
		httpx.Error(w, apperr.New("INVALID_CREDENTIALS", "Email or password is incorrect.", http.StatusUnauthorized))
		return
	}
	ok, err := VerifyPassword(user.PasswordHash, req.Password)
	if err != nil || !ok || !user.Active {
		httpx.Error(w, apperr.New("INVALID_CREDENTIALS", "Email or password is incorrect.", http.StatusUnauthorized))
		return
	}
	if err := s.issueSession(w, r, user.ID); err != nil {
		httpx.Error(w, err)
		return
	}
	httpx.JSON(w, http.StatusOK, userDTOFrom(user), nil)
}

func (s *Service) handleLogout(w http.ResponseWriter, r *http.Request) {
	if c, err := r.Cookie(s.cookieName); err == nil {
		_ = s.q.DeleteSessionByTokenHash(r.Context(), HashToken(c.Value))
	}
	http.SetCookie(w, &http.Cookie{
		Name:     s.cookieName,
		Value:    "",
		Path:     "/",
		MaxAge:   -1,
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
		Secure:   s.secure,
	})
	httpx.JSON(w, http.StatusOK, map[string]bool{"ok": true}, nil)
}

func (s *Service) handleMe(w http.ResponseWriter, r *http.Request) {
	a, ok := actor.From(r.Context())
	if !ok || !a.IsUser() {
		httpx.Error(w, apperr.New("UNAUTHENTICATED", "Authentication required.", http.StatusUnauthorized))
		return
	}
	user, err := s.q.GetUserByID(r.Context(), a.ID)
	if err != nil {
		httpx.Error(w, apperr.New("UNAUTHENTICATED", "Authentication required.", http.StatusUnauthorized))
		return
	}
	httpx.JSON(w, http.StatusOK, userDTOFrom(user), nil)
}

func (s *Service) issueSession(w http.ResponseWriter, r *http.Request, userID uuid.UUID) error {
	raw, hash, err := NewSessionToken()
	if err != nil {
		return err
	}
	expires := time.Now().Add(s.ttl)
	_, err = s.q.CreateSession(r.Context(), db.CreateSessionParams{
		UserID:    userID,
		TokenHash: hash,
		ExpiresAt: pgtype.Timestamptz{Time: expires, Valid: true},
	})
	if err != nil {
		return err
	}
	http.SetCookie(w, &http.Cookie{
		Name:     s.cookieName,
		Value:    raw,
		Path:     "/",
		Expires:  expires,
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
		Secure:   s.secure,
	})
	return nil
}

func (s *Service) Middleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()
		if a, ok := s.authenticate(r); ok {
			ctx = actor.With(ctx, a)
		}
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func (s *Service) RequireUser(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if _, ok := actor.From(r.Context()); !ok {
			httpx.Error(w, apperr.New("UNAUTHENTICATED", "Authentication required.", http.StatusUnauthorized))
			return
		}
		next.ServeHTTP(w, r)
	})
}

func (s *Service) authenticate(r *http.Request) (actor.Actor, bool) {
	if h := r.Header.Get("Authorization"); strings.HasPrefix(h, "Bearer ") {
		token := strings.TrimSpace(strings.TrimPrefix(h, "Bearer "))
		if strings.HasPrefix(token, "tops_sk_") {
			return s.authenticateAPIKey(r.Context(), token)
		}
	}
	c, err := r.Cookie(s.cookieName)
	if err != nil || c.Value == "" {
		return actor.Actor{}, false
	}
	sess, err := s.q.GetSessionByTokenHash(r.Context(), HashToken(c.Value))
	if err != nil {
		return actor.Actor{}, false
	}
	user, err := s.q.GetUserByID(r.Context(), sess.UserID)
	if err != nil || !user.Active {
		return actor.Actor{}, false
	}
	return actor.Actor{
		Type:  actor.TypeUser,
		ID:    user.ID,
		Name:  user.Name,
		Email: user.Email,
	}, true
}

func (s *Service) authenticateAPIKey(ctx context.Context, raw string) (actor.Actor, bool) {
	key, err := s.q.GetAPIKeyByHash(ctx, HashToken(raw))
	if err != nil {
		return actor.Actor{}, false
	}
	ag, err := s.q.GetAgent(ctx, key.AgentID)
	if err != nil || !ag.Active {
		return actor.Actor{}, false
	}
	_ = s.q.TouchAPIKeyLastUsed(ctx, key.ID)
	_ = s.q.TouchAgentLastSeen(ctx, ag.ID)
	return actor.Actor{
		Type:           actor.TypeAgent,
		ID:             ag.ID,
		OrganizationID: ag.OrganizationID,
		DeveloperID:    ag.DeveloperID,
		Scopes:         key.Scopes,
		Name:           ag.Name,
	}, true
}

func userDTOFrom(u db.User) userDTO {
	return userDTO{
		ID:        u.ID,
		Name:      u.Name,
		Email:     u.Email,
		AvatarURL: u.AvatarUrl,
		CreatedAt: u.CreatedAt.Time,
	}
}

func isUniqueViolation(err error) bool {
	return strings.Contains(err.Error(), "duplicate key") || strings.Contains(err.Error(), "unique constraint")
}

func RequireActor(w http.ResponseWriter, r *http.Request) (actor.Actor, bool) {
	a, ok := actor.From(r.Context())
	if !ok {
		httpx.Error(w, apperr.New("UNAUTHENTICATED", "Authentication required.", http.StatusUnauthorized))
		return actor.Actor{}, false
	}
	return a, true
}

func PgErrIsNoRows(err error) bool {
	return errors.Is(err, pgx.ErrNoRows)
}
