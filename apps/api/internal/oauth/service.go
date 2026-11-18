// Package oauth lets MCP clients (Claude Code, Cursor, VS Code, …) connect to
// Team-Ops with a browser sign-in instead of a pasted API key.
//
// It implements the pieces of OAuth 2.1 the MCP authorization spec relies on:
// protected-resource metadata (RFC 9728), authorization-server metadata
// (RFC 8414), dynamic client registration (RFC 7591), the authorization-code
// grant with PKCE S256, refresh-token rotation, and revocation (RFC 7009).
//
// Approving a client creates (or reuses) an agent owned by the person who
// approved it, in the organization they picked. Tokens act as that agent, so
// everything downstream — attribution, activity, reports — works the same way
// as for any other agent.
package oauth

import (
	"crypto/sha256"
	"crypto/subtle"
	"encoding/base64"
	"encoding/json"
	"errors"
	"net"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/team-ops/api/internal/apperr"
	"github.com/team-ops/api/internal/auth"
	"github.com/team-ops/api/internal/db"
	"github.com/team-ops/api/internal/organizations"
	httpx "github.com/team-ops/api/platform/http"
)

const (
	codeTTL         = 10 * time.Minute
	accessTokenTTL  = time.Hour
	refreshTokenTTL = 60 * 24 * time.Hour
	maxRedirectURIs = 10
	maxClientName   = 60
)

type Service struct {
	q      *db.Queries
	orgs   *organizations.Service
	issuer string
}

// New takes the public URL people open (APP_URL). It is the OAuth issuer, and
// the MCP endpoint lives at issuer + "/mcp".
func New(pool *pgxpool.Pool, orgs *organizations.Service, appURL string) *Service {
	return &Service{q: db.New(pool), orgs: orgs, issuer: strings.TrimRight(appURL, "/")}
}

func (s *Service) Issuer() string   { return s.issuer }
func (s *Service) Resource() string { return s.issuer + "/mcp" }

// PublicRoutes are mounted at the root: discovery documents and the
// endpoints MCP clients call without a session.
func (s *Service) PublicRoutes(r chi.Router) {
	r.Get("/.well-known/oauth-authorization-server", s.authServerMetadata)
	r.Get("/.well-known/oauth-protected-resource", s.resourceMetadata)
	r.Get("/.well-known/oauth-protected-resource/mcp", s.resourceMetadata)
	r.Post("/oauth/register", s.register)
	r.Post("/oauth/token", s.token)
	r.Post("/oauth/revoke", s.revoke)
}

// SessionRoutes back the consent screen in the web app (/oauth/authorize).
// Mount under /v1/oauth behind the session requirement.
func (s *Service) SessionRoutes() chi.Router {
	r := chi.NewRouter()
	r.Get("/clients/{clientID}", s.getClient)
	r.Post("/authorize", s.authorize)
	return r
}

// ---- discovery -------------------------------------------------------------

func (s *Service) authServerMetadata(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, map[string]any{
		"issuer":                                s.issuer,
		"authorization_endpoint":                s.issuer + "/oauth/authorize",
		"token_endpoint":                        s.issuer + "/oauth/token",
		"registration_endpoint":                 s.issuer + "/oauth/register",
		"revocation_endpoint":                   s.issuer + "/oauth/revoke",
		"response_types_supported":              []string{"code"},
		"grant_types_supported":                 []string{"authorization_code", "refresh_token"},
		"code_challenge_methods_supported":      []string{"S256"},
		"token_endpoint_auth_methods_supported": []string{"none"},
		"scopes_supported":                      auth.DefaultAgentScopes,
	})
}

func (s *Service) resourceMetadata(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, map[string]any{
		"resource":                 s.Resource(),
		"resource_name":            "Team-Ops board",
		"authorization_servers":    []string{s.issuer},
		"bearer_methods_supported": []string{"header"},
		"scopes_supported":         auth.DefaultAgentScopes,
	})
}

// ---- dynamic client registration ------------------------------------------

type registerRequest struct {
	ClientName   string   `json:"client_name"`
	RedirectURIs []string `json:"redirect_uris"`
	GrantTypes   []string `json:"grant_types"`
	AuthMethod   string   `json:"token_endpoint_auth_method"`
}

func (s *Service) register(w http.ResponseWriter, r *http.Request) {
	var req registerRequest
	if err := json.NewDecoder(http.MaxBytesReader(w, r.Body, 16<<10)).Decode(&req); err != nil {
		oauthError(w, http.StatusBadRequest, "invalid_client_metadata", "Body must be JSON client metadata.")
		return
	}
	if len(req.RedirectURIs) == 0 || len(req.RedirectURIs) > maxRedirectURIs {
		oauthError(w, http.StatusBadRequest, "invalid_redirect_uri", "Provide between 1 and 10 redirect_uris.")
		return
	}
	for _, u := range req.RedirectURIs {
		if !allowedRedirectURI(u) {
			oauthError(w, http.StatusBadRequest, "invalid_redirect_uri", "Redirect URIs must be https, loopback http, or an app scheme: "+u)
			return
		}
	}
	if req.AuthMethod != "" && req.AuthMethod != "none" {
		// Coding agents are public clients; there is no secret to keep.
		req.AuthMethod = "none"
	}
	name := strings.TrimSpace(req.ClientName)
	if name == "" {
		name = "MCP client"
	}
	if len([]rune(name)) > maxClientName {
		name = string([]rune(name)[:maxClientName])
	}
	clientID := "tops_client_" + strings.ReplaceAll(uuid.NewString(), "-", "")
	c, err := s.q.CreateOAuthClient(r.Context(), db.CreateOAuthClientParams{
		ClientID: clientID, ClientName: name, RedirectUris: req.RedirectURIs,
	})
	if err != nil {
		oauthError(w, http.StatusInternalServerError, "server_error", "Could not register the client.")
		return
	}
	writeJSON(w, http.StatusCreated, map[string]any{
		"client_id":                  c.ClientID,
		"client_id_issued_at":        c.CreatedAt.Time.Unix(),
		"client_name":                c.ClientName,
		"redirect_uris":              c.RedirectUris,
		"grant_types":                []string{"authorization_code", "refresh_token"},
		"response_types":             []string{"code"},
		"token_endpoint_auth_method": "none",
	})
}

// allowedRedirectURI accepts https, http on a loopback host (native apps,
// RFC 8252), and private-use app schemes like cursor:// or vscode://.
func allowedRedirectURI(raw string) bool {
	u, err := url.Parse(raw)
	if err != nil || u.Scheme == "" || u.Fragment != "" {
		return false
	}
	switch strings.ToLower(u.Scheme) {
	case "https":
		return u.Host != ""
	case "http":
		return isLoopback(u.Hostname())
	case "javascript", "data", "file", "vbscript", "blob":
		return false
	default:
		return true
	}
}

func isLoopback(host string) bool {
	if host == "localhost" {
		return true
	}
	ip := net.ParseIP(host)
	return ip != nil && ip.IsLoopback()
}

// redirectMatches compares a requested redirect URI with a registered one.
// Loopback redirects may use any port (RFC 8252 §7.3); everything else is exact.
func redirectMatches(registered []string, requested string) bool {
	req, err := url.Parse(requested)
	if err != nil {
		return false
	}
	for _, reg := range registered {
		if reg == requested {
			return true
		}
		ru, err := url.Parse(reg)
		if err != nil {
			continue
		}
		if ru.Scheme == "http" && req.Scheme == "http" && isLoopback(ru.Hostname()) &&
			ru.Hostname() == req.Hostname() && ru.Path == req.Path && ru.RawQuery == req.RawQuery {
			return true
		}
	}
	return false
}

// ---- consent (session) -----------------------------------------------------

func (s *Service) getClient(w http.ResponseWriter, r *http.Request) {
	c, err := s.q.GetOAuthClient(r.Context(), chi.URLParam(r, "clientID"))
	if err != nil {
		httpx.Error(w, apperr.New("NOT_FOUND", "Unknown application. Ask your editor to reconnect.", http.StatusNotFound))
		return
	}
	httpx.JSON(w, http.StatusOK, map[string]any{
		"clientId":     c.ClientID,
		"clientName":   c.ClientName,
		"redirectUris": c.RedirectUris,
	}, nil)
}

type authorizeRequest struct {
	ClientID            string    `json:"clientId"`
	RedirectURI         string    `json:"redirectUri"`
	CodeChallenge       string    `json:"codeChallenge"`
	CodeChallengeMethod string    `json:"codeChallengeMethod"`
	State               string    `json:"state"`
	Resource            string    `json:"resource"`
	OrganizationID      uuid.UUID `json:"organizationId"`
}

// authorize records the signed-in person's approval and returns the URL to
// send the browser back to, carrying a one-time code.
func (s *Service) authorize(w http.ResponseWriter, r *http.Request) {
	a, ok := auth.RequireActor(w, r)
	if !ok {
		return
	}
	if !a.IsUser() {
		httpx.Error(w, apperr.New("FORBIDDEN", "Sign in to approve an application.", http.StatusForbidden))
		return
	}
	var req authorizeRequest
	if err := httpx.Decode(r, &req); err != nil {
		httpx.Error(w, err)
		return
	}
	client, err := s.q.GetOAuthClient(r.Context(), req.ClientID)
	if err != nil {
		httpx.Error(w, apperr.New("VALIDATION", "Unknown application.", http.StatusBadRequest))
		return
	}
	if !redirectMatches(client.RedirectUris, req.RedirectURI) {
		httpx.Error(w, apperr.New("VALIDATION", "The redirect address is not registered for this application.", http.StatusBadRequest))
		return
	}
	if req.CodeChallengeMethod != "S256" || len(req.CodeChallenge) < 43 || len(req.CodeChallenge) > 128 {
		httpx.Error(w, apperr.New("VALIDATION", "PKCE with S256 is required.", http.StatusBadRequest))
		return
	}
	if req.Resource != "" && strings.TrimRight(req.Resource, "/") != s.Resource() && strings.TrimRight(req.Resource, "/") != s.issuer {
		httpx.Error(w, apperr.New("VALIDATION", "This server only issues tokens for "+s.Resource()+".", http.StatusBadRequest))
		return
	}
	member, _, err := s.orgs.Authorize(r.Context(), a, req.OrganizationID)
	if err != nil {
		httpx.Error(w, err)
		return
	}
	if !member.CanWriteTasks() {
		httpx.Error(w, apperr.New("FORBIDDEN", "Viewers can't connect coding agents. Ask an admin for developer access.", http.StatusForbidden))
		return
	}

	agent, err := s.agentFor(r, a.ID, req.OrganizationID, client.ClientName)
	if err != nil {
		httpx.Error(w, err)
		return
	}
	raw, hash, err := auth.NewOpaqueToken(auth.OAuthCodePrefix)
	if err != nil {
		httpx.Error(w, err)
		return
	}
	var resource *string
	if req.Resource != "" {
		resource = &req.Resource
	}
	if err := s.q.CreateOAuthCode(r.Context(), db.CreateOAuthCodeParams{
		CodeHash:      hash,
		ClientID:      client.ClientID,
		AgentID:       agent.ID,
		RedirectUri:   req.RedirectURI,
		CodeChallenge: req.CodeChallenge,
		Resource:      resource,
		ExpiresAt:     pgtype.Timestamptz{Time: time.Now().Add(codeTTL), Valid: true},
	}); err != nil {
		httpx.Error(w, err)
		return
	}

	back, _ := url.Parse(req.RedirectURI)
	q := back.Query()
	q.Set("code", raw)
	if req.State != "" {
		q.Set("state", req.State)
	}
	q.Set("iss", s.issuer)
	back.RawQuery = q.Encode()
	httpx.JSON(w, http.StatusOK, map[string]any{"redirectTo": back.String(), "agentId": agent.ID}, nil)
}

// agentFor returns the person's agent for this app in this organization,
// creating it on first approval and re-enabling it if it was disconnected.
func (s *Service) agentFor(r *http.Request, userID, orgID uuid.UUID, clientName string) (db.Agent, error) {
	ctx := r.Context()
	ag, err := s.q.FindAgentForOAuth(ctx, db.FindAgentForOAuthParams{
		OrganizationID: &orgID, DeveloperID: &userID, Name: clientName,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		desc := "Connected with OAuth"
		return s.q.CreateAgent(ctx, db.CreateAgentParams{
			Name: clientName, DeveloperID: &userID, OrganizationID: &orgID, Description: &desc,
		})
	}
	if err != nil {
		return db.Agent{}, err
	}
	if !ag.Active {
		on := true
		return s.q.UpdateAgent(ctx, db.UpdateAgentParams{ID: ag.ID, Active: &on})
	}
	return ag, nil
}

// ---- token endpoint --------------------------------------------------------

func (s *Service) token(w http.ResponseWriter, r *http.Request) {
	form, ok := readForm(w, r)
	if !ok {
		return
	}
	switch form.Get("grant_type") {
	case "authorization_code":
		s.exchangeCode(w, r, form)
	case "refresh_token":
		s.refresh(w, r, form)
	default:
		oauthError(w, http.StatusBadRequest, "unsupported_grant_type", "Use authorization_code or refresh_token.")
	}
}

func (s *Service) exchangeCode(w http.ResponseWriter, r *http.Request, form url.Values) {
	code, verifier, clientID := form.Get("code"), form.Get("code_verifier"), form.Get("client_id")
	if code == "" || verifier == "" || clientID == "" {
		oauthError(w, http.StatusBadRequest, "invalid_request", "code, code_verifier and client_id are required.")
		return
	}
	row, err := s.q.ConsumeOAuthCode(r.Context(), auth.HashToken(code))
	if err != nil {
		oauthError(w, http.StatusBadRequest, "invalid_grant", "The code is invalid, expired or already used.")
		return
	}
	if row.ClientID != clientID || row.RedirectUri != form.Get("redirect_uri") {
		oauthError(w, http.StatusBadRequest, "invalid_grant", "The code was issued to a different client or redirect URI.")
		return
	}
	sum := sha256.Sum256([]byte(verifier))
	if subtle.ConstantTimeCompare([]byte(base64.RawURLEncoding.EncodeToString(sum[:])), []byte(row.CodeChallenge)) != 1 {
		oauthError(w, http.StatusBadRequest, "invalid_grant", "PKCE verification failed.")
		return
	}
	s.issueTokens(w, r, clientID, row.AgentID)
}

func (s *Service) refresh(w http.ResponseWriter, r *http.Request, form url.Values) {
	raw, clientID := form.Get("refresh_token"), form.Get("client_id")
	if raw == "" {
		oauthError(w, http.StatusBadRequest, "invalid_request", "refresh_token is required.")
		return
	}
	hash := auth.HashToken(raw)
	tok, err := s.q.GetActiveOAuthToken(r.Context(), db.GetActiveOAuthTokenParams{TokenHash: hash, Kind: "refresh"})
	if err != nil || (clientID != "" && clientID != tok.ClientID) {
		oauthError(w, http.StatusBadRequest, "invalid_grant", "The refresh token is invalid, expired or revoked.")
		return
	}
	// Rotation: each refresh token works once.
	if n, err := s.q.RevokeOAuthToken(r.Context(), hash); err != nil || n == 0 {
		oauthError(w, http.StatusBadRequest, "invalid_grant", "The refresh token was already used.")
		return
	}
	s.issueTokens(w, r, tok.ClientID, tok.AgentID)
}

func (s *Service) issueTokens(w http.ResponseWriter, r *http.Request, clientID string, agentID uuid.UUID) {
	ag, err := s.q.GetAgent(r.Context(), agentID)
	if err != nil || !ag.Active {
		oauthError(w, http.StatusBadRequest, "invalid_grant", "This connection was disconnected in Team-Ops.")
		return
	}
	access, accessHash, err1 := auth.NewOpaqueToken(auth.OAuthAccessPrefix)
	refresh, refreshHash, err2 := auth.NewOpaqueToken(auth.OAuthRefreshPrefix)
	if err1 != nil || err2 != nil {
		oauthError(w, http.StatusInternalServerError, "server_error", "Could not issue tokens.")
		return
	}
	now := time.Now()
	for _, t := range []db.CreateOAuthTokenParams{
		{TokenHash: accessHash, Kind: "access", ClientID: clientID, AgentID: agentID, ExpiresAt: pgtype.Timestamptz{Time: now.Add(accessTokenTTL), Valid: true}},
		{TokenHash: refreshHash, Kind: "refresh", ClientID: clientID, AgentID: agentID, ExpiresAt: pgtype.Timestamptz{Time: now.Add(refreshTokenTTL), Valid: true}},
	} {
		if _, err := s.q.CreateOAuthToken(r.Context(), t); err != nil {
			oauthError(w, http.StatusInternalServerError, "server_error", "Could not issue tokens.")
			return
		}
	}
	writeJSON(w, http.StatusOK, map[string]any{
		"access_token":  access,
		"token_type":    "Bearer",
		"expires_in":    int(accessTokenTTL.Seconds()),
		"refresh_token": refresh,
		"scope":         strings.Join(auth.DefaultAgentScopes, " "),
	})
}

// revoke implements RFC 7009: always 200, whether or not the token existed.
func (s *Service) revoke(w http.ResponseWriter, r *http.Request) {
	form, ok := readForm(w, r)
	if !ok {
		return
	}
	if t := form.Get("token"); t != "" {
		_, _ = s.q.RevokeOAuthToken(r.Context(), auth.HashToken(t))
	}
	w.WriteHeader(http.StatusOK)
}

// ---- helpers ---------------------------------------------------------------

// readForm accepts the standard form encoding and, leniently, JSON.
func readForm(w http.ResponseWriter, r *http.Request) (url.Values, bool) {
	r.Body = http.MaxBytesReader(w, r.Body, 16<<10)
	if strings.HasPrefix(r.Header.Get("Content-Type"), "application/json") {
		var body map[string]any
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
			oauthError(w, http.StatusBadRequest, "invalid_request", "Malformed body.")
			return nil, false
		}
		v := url.Values{}
		for k, val := range body {
			if s, ok := val.(string); ok {
				v.Set(k, s)
			}
		}
		return v, true
	}
	if err := r.ParseForm(); err != nil {
		oauthError(w, http.StatusBadRequest, "invalid_request", "Malformed form body.")
		return nil, false
	}
	return r.PostForm, true
}

func writeJSON(w http.ResponseWriter, status int, body any) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Cache-Control", "no-store")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(body)
}

func oauthError(w http.ResponseWriter, status int, code, description string) {
	writeJSON(w, status, map[string]string{"error": code, "error_description": description})
}
