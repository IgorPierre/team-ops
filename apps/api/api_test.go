package api_test

import (
	"bytes"
	"context"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"io"
	"net/http"
	"net/http/cookiejar"
	"net/http/httptest"
	"net/url"
	"os"
	"strings"
	"testing"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/team-ops/api/internal/agents"
	"github.com/team-ops/api/internal/auth"
	"github.com/team-ops/api/internal/oauth"
	"github.com/team-ops/api/internal/organizations"
	"github.com/team-ops/api/internal/projects"
	"github.com/team-ops/api/internal/tasks"
	"github.com/team-ops/api/platform/logging"
)

type envelope struct {
	Data  json.RawMessage `json:"data"`
	Error *struct {
		Code    string `json:"code"`
		Message string `json:"message"`
	} `json:"error"`
}

func TestPasswordHashRoundTrip(t *testing.T) {
	hash, err := auth.HashPassword("correct horse")
	if err != nil {
		t.Fatal(err)
	}
	ok, err := auth.VerifyPassword(hash, "correct horse")
	if err != nil || !ok {
		t.Fatalf("expected match, err=%v ok=%v", err, ok)
	}
	ok, err = auth.VerifyPassword(hash, "wrong")
	if err != nil || ok {
		t.Fatalf("expected mismatch")
	}
}

func TestAPIKeyFormat(t *testing.T) {
	raw, prefix, hash, err := auth.NewAPIKey()
	if err != nil {
		t.Fatal(err)
	}
	if !strings.HasPrefix(raw, "tops_sk_") {
		t.Fatalf("prefix: %s", raw)
	}
	if !strings.HasPrefix(raw, prefix) {
		t.Fatalf("stored prefix %s should be the start of %s", prefix, raw)
	}
	if hash == raw {
		t.Fatal("must not store the raw key")
	}
}

func TestTaskFlow(t *testing.T) {
	pool := testPool(t)
	srv, client := testServer(t, pool)

	admin := register(t, client, srv.URL, "Admin User", uniqueEmail("admin"), "password123")
	org := createOrg(t, client, srv.URL, "Acme", uniqueSlug("acme"))
	project := createProject(t, client, srv.URL, org.ID, "ERP", "ERP")

	task := createTask(t, client, srv.URL, map[string]any{
		"organizationId": org.ID,
		"projectId":      project.ID,
		"title":          "Implement auth",
		"priority":       "high",
		"externalRef":    "github-issue-182",
	})
	if task.Title != "Implement auth" {
		t.Fatalf("title: %s", task.Title)
	}

	dup := do(t, client, http.MethodPost, srv.URL+"/v1/tasks", map[string]any{
		"organizationId": org.ID,
		"projectId":      project.ID,
		"title":          "Implement auth again",
		"externalRef":    "github-issue-182",
	})
	if dup.Error == nil || dup.Error.Code != "DUPLICATE_EXTERNAL_REF" {
		t.Fatalf("expected duplicate external_ref, got %#v", dup.Error)
	}

	moved := moveTask(t, client, srv.URL, task.ID, "in_progress", task.Version)
	if moved.Status != "in_progress" {
		t.Fatalf("status: %s", moved.Status)
	}

	conflict := do(t, client, http.MethodPost, srv.URL+"/v1/tasks/"+task.ID+"/move", map[string]any{
		"status":          "review",
		"expectedVersion": task.Version,
	})
	if conflict.Error == nil || conflict.Error.Code != "TASK_VERSION_CONFLICT" {
		t.Fatalf("expected version conflict, got %#v", conflict.Error)
	}

	reviewed := doOK(t, client, http.MethodPost, srv.URL+"/v1/tasks/"+moved.ID+"/review", map[string]any{
		"summary":         "PR opened",
		"expectedVersion": moved.Version,
	})
	var reviewTask taskDTO
	mustUnmarshal(t, reviewed.Data, &reviewTask)
	if reviewTask.Status != "review" {
		t.Fatalf("review status: %s", reviewTask.Status)
	}

	noSummary := do(t, client, http.MethodPost, srv.URL+"/v1/tasks/"+reviewTask.ID+"/complete", map[string]any{
		"completionSummary":     "",
		"acceptanceCriteriaMet": true,
		"expectedVersion":       reviewTask.Version,
	})
	if noSummary.Error == nil || noSummary.Error.Code != "VALIDATION" {
		t.Fatalf("expected validation on empty summary, got %#v", noSummary.Error)
	}

	noProof := do(t, client, http.MethodPost, srv.URL+"/v1/tasks/"+reviewTask.ID+"/complete", map[string]any{
		"completionSummary":     "Shipped with tests.",
		"acceptanceCriteriaMet": true,
		"expectedVersion":       reviewTask.Version,
	})
	if noProof.Error == nil || noProof.Error.Code != "PROOF_REQUIRED" {
		t.Fatalf("expected PROOF_REQUIRED without proof, got %#v", noProof.Error)
	}
	badProof := do(t, client, http.MethodPost, srv.URL+"/v1/tasks/"+reviewTask.ID+"/complete", map[string]any{
		"completionSummary":     "Shipped with tests.",
		"acceptanceCriteriaMet": true,
		"proof":                 map[string]any{"kind": "github", "url": "javascript:alert(1)"},
		"expectedVersion":       reviewTask.Version,
	})
	if badProof.Error == nil || badProof.Error.Code != "VALIDATION" {
		t.Fatalf("expected VALIDATION on a non-http proof url, got %#v", badProof.Error)
	}

	done := doOK(t, client, http.MethodPost, srv.URL+"/v1/tasks/"+reviewTask.ID+"/complete", map[string]any{
		"completionSummary":     "Shipped with tests.",
		"acceptanceCriteriaMet": true,
		"proof":                 map[string]any{"kind": "github", "url": "https://github.com/acme/api/pull/42"},
		"expectedVersion":       reviewTask.Version,
	})
	var completed struct {
		taskDTO
		Proof *struct {
			Kind string  `json:"kind"`
			URL  *string `json:"url"`
		} `json:"proof"`
	}
	mustUnmarshal(t, done.Data, &completed)
	if completed.Status != "done" {
		t.Fatalf("complete status: %s", completed.Status)
	}
	if completed.Proof == nil || completed.Proof.Kind != "github" || completed.Proof.URL == nil {
		t.Fatalf("complete proof: %#v", completed.Proof)
	}

	feed := doOK(t, client, http.MethodGet, srv.URL+"/v1/tasks/activity?organizationId="+org.ID+"&actorId="+admin.ID, nil)
	var activity []struct {
		TaskKey   string `json:"taskKey"`
		ActorType string `json:"actorType"`
		Action    string `json:"action"`
	}
	mustUnmarshal(t, feed.Data, &activity)
	if len(activity) < 4 {
		t.Fatalf("expected the create/move/review/complete activities, got %d", len(activity))
	}
	for _, a := range activity {
		if a.TaskKey != task.Key || a.ActorType != "user" {
			t.Fatalf("unexpected activity row: %#v", a)
		}
	}
	unknownActor := doOK(t, client, http.MethodGet, srv.URL+"/v1/tasks/activity?organizationId="+org.ID+"&actorId="+uuid.NewString(), nil)
	if strings.TrimSpace(string(unknownActor.Data)) != "[]" {
		t.Fatalf("expected empty feed for unknown actor, got %s", unknownActor.Data)
	}

	archived := doOK(t, client, http.MethodPost, srv.URL+"/v1/tasks/"+completed.ID+"/archive", map[string]any{
		"expectedVersion": completed.Version,
	})
	if archived.Error != nil {
		t.Fatalf("archive: %#v", archived.Error)
	}
	_ = admin
}

func TestPermissions(t *testing.T) {
	pool := testPool(t)
	srv, adminClient := testServer(t, pool)

	_ = register(t, adminClient, srv.URL, "Org Admin", uniqueEmail("orgadmin"), "password123")
	org := createOrg(t, adminClient, srv.URL, "Perms Co", uniqueSlug("perms"))
	project := createProject(t, adminClient, srv.URL, org.ID, "APP", "APP")

	devJar, _ := cookiejar.New(nil)
	devClient := &http.Client{Jar: devJar, Timeout: 10 * time.Second}
	dev := register(t, devClient, srv.URL, "Dev User", uniqueEmail("dev"), "password123")
	inviteMember(t, adminClient, srv.URL, org.ID, dev.Email, "developer")

	viewJar, _ := cookiejar.New(nil)
	viewClient := &http.Client{Jar: viewJar, Timeout: 10 * time.Second}
	viewer := register(t, viewClient, srv.URL, "View User", uniqueEmail("view"), "password123")
	inviteMember(t, adminClient, srv.URL, org.ID, viewer.Email, "viewer")

	created := doOK(t, devClient, http.MethodPost, srv.URL+"/v1/tasks", map[string]any{
		"organizationId": org.ID,
		"projectId":      project.ID,
		"title":          "Dev can create",
	})
	var task taskDTO
	mustUnmarshal(t, created.Data, &task)

	forbidden := do(t, viewClient, http.MethodPost, srv.URL+"/v1/tasks", map[string]any{
		"organizationId": org.ID,
		"projectId":      project.ID,
		"title":          "Viewer cannot create",
	})
	if forbidden.Error == nil || forbidden.Error.Code != "FORBIDDEN" {
		t.Fatalf("viewer create: %#v", forbidden.Error)
	}

	listed := doOK(t, viewClient, http.MethodGet, srv.URL+"/v1/tasks?organizationId="+org.ID, nil)
	if listed.Error != nil {
		t.Fatalf("viewer list: %#v", listed.Error)
	}
}

func TestInviteJoin(t *testing.T) {
	pool := testPool(t)
	srv, adminClient := testServer(t, pool)
	_ = register(t, adminClient, srv.URL, "Admin", uniqueEmail("invadmin"), "password123")
	org := createOrg(t, adminClient, srv.URL, "Invite Co", uniqueSlug("invite"))

	created := doOK(t, adminClient, http.MethodPost, srv.URL+"/v1/organizations/"+org.ID+"/invites", map[string]any{
		"role": "developer",
	})
	var inv struct {
		Token string `json:"token"`
		Role  string `json:"role"`
	}
	mustUnmarshal(t, created.Data, &inv)
	if !strings.HasPrefix(inv.Token, "tops_inv_") {
		t.Fatalf("token: %s", inv.Token)
	}

	peek := doOK(t, http.DefaultClient, http.MethodGet, srv.URL+"/v1/auth/invite?token="+inv.Token, nil)
	var preview struct {
		OrganizationName string `json:"organizationName"`
		Role             string `json:"role"`
	}
	mustUnmarshal(t, peek.Data, &preview)
	if preview.OrganizationName != "Invite Co" || preview.Role != "developer" {
		t.Fatalf("preview: %#v", preview)
	}

	jar, _ := cookiejar.New(nil)
	joiner := &http.Client{Jar: jar, Timeout: 10 * time.Second}
	_ = register(t, joiner, srv.URL, "Joiner", uniqueEmail("joiner"), "password123", inv.Token)
	orgs := doOK(t, joiner, http.MethodGet, srv.URL+"/v1/organizations", nil)
	var listed []orgDTO
	mustUnmarshal(t, orgs.Data, &listed)
	if len(listed) != 1 || listed[0].ID != org.ID {
		t.Fatalf("joined orgs: %#v", listed)
	}

	badJar, _ := cookiejar.New(nil)
	badClient := &http.Client{Jar: badJar, Timeout: 10 * time.Second}
	bad := do(t, badClient, http.MethodPost, srv.URL+"/v1/auth/register", map[string]any{
		"name": "Nope", "email": uniqueEmail("nope"), "password": "password123", "inviteToken": "tops_inv_deadbeef",
	})
	if bad.Error == nil || bad.Error.Code != "INVALID_INVITE" {
		t.Fatalf("bad invite: %#v", bad.Error)
	}
}

func TestClosedRegistration(t *testing.T) {
	pool := testPool(t)
	srv, c := testServerOpts(t, pool, false)
	cfg := doOK(t, c, http.MethodGet, srv.URL+"/v1/auth/config", nil)
	var mode struct {
		Registration string `json:"registration"`
	}
	mustUnmarshal(t, cfg.Data, &mode)
	env := do(t, c, http.MethodPost, srv.URL+"/v1/auth/register", map[string]any{
		"name": "Stranger", "email": uniqueEmail("stranger"), "password": "password123",
	})
	if mode.Registration == "bootstrap" {
		if env.Error != nil {
			t.Fatalf("bootstrap register: %#v", env.Error)
		}
		again := do(t, c, http.MethodPost, srv.URL+"/v1/auth/register", map[string]any{
			"name": "Two", "email": uniqueEmail("two"), "password": "password123",
		})
		if again.Error == nil || again.Error.Code != "REGISTRATION_CLOSED" {
			t.Fatalf("second register: %#v", again.Error)
		}
		return
	}
	if env.Error == nil || env.Error.Code != "REGISTRATION_CLOSED" {
		t.Fatalf("closed register: %#v", env.Error)
	}
}

func testPool(t *testing.T) *pgxpool.Pool {
	t.Helper()
	dsn := os.Getenv("TEST_DATABASE_URL")
	if dsn == "" {
		dsn = os.Getenv("DATABASE_URL")
	}
	if dsn == "" {
		t.Skip("DATABASE_URL / TEST_DATABASE_URL not set")
	}
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	pool, err := pgxpool.New(ctx, dsn)
	if err != nil {
		t.Skip(err.Error())
	}
	if err := pool.Ping(ctx); err != nil {
		t.Skip(err.Error())
	}
	t.Cleanup(pool.Close)
	return pool
}

func testServer(t *testing.T, pool *pgxpool.Pool) (*httptest.Server, *http.Client) {
	t.Helper()
	return testServerOpts(t, pool, true)
}

func testServerOpts(t *testing.T, pool *pgxpool.Pool, registrationOpen bool) (*httptest.Server, *http.Client) {
	t.Helper()
	log := logging.Discard()
	authSvc := auth.NewService(pool, "teamops_session", false, 24*time.Hour, registrationOpen, log)
	orgSvc := organizations.New(pool, registrationOpen)
	authSvc.SetInviteJoiner(orgSvc)
	projectSvc := projects.New(pool, orgSvc)
	taskSvc := tasks.New(pool, orgSvc)
	agentSvc := agents.New(pool, orgSvc)
	oauthSvc := oauth.New(pool, orgSvc, testIssuer)

	r := chi.NewRouter()
	r.Use(authSvc.Middleware)
	oauthSvc.PublicRoutes(r)
	r.Route("/v1", func(r chi.Router) {
		r.Mount("/auth", authSvc.Routes())
		r.Group(func(r chi.Router) {
			r.Use(authSvc.RequireUser)
			r.Mount("/organizations", orgSvc.Routes())
			r.Mount("/projects", projectSvc.Routes())
			r.Mount("/tasks", taskSvc.Routes())
			r.Mount("/agents", agentSvc.Routes())
			r.Mount("/oauth", oauthSvc.SessionRoutes())
		})
	})
	srv := httptest.NewServer(r)
	t.Cleanup(srv.Close)
	jar, _ := cookiejar.New(nil)
	return srv, &http.Client{Jar: jar, Timeout: 10 * time.Second}
}

type userDTO struct {
	ID    string `json:"id"`
	Email string `json:"email"`
	Name  string `json:"name"`
}

type orgDTO struct {
	ID   string `json:"id"`
	Slug string `json:"slug"`
}

type projectDTO struct {
	ID  string `json:"id"`
	Key string `json:"key"`
}

type taskDTO struct {
	ID      string `json:"id"`
	Key     string `json:"key"`
	Title   string `json:"title"`
	Status  string `json:"status"`
	Version int32  `json:"version"`
}

func register(t *testing.T, client *http.Client, base, name, email, password string, inviteToken ...string) userDTO {
	t.Helper()
	body := map[string]any{"name": name, "email": email, "password": password}
	if len(inviteToken) > 0 && inviteToken[0] != "" {
		body["inviteToken"] = inviteToken[0]
	}
	env := doOK(t, client, http.MethodPost, base+"/v1/auth/register", body)
	var u userDTO
	mustUnmarshal(t, env.Data, &u)
	return u
}

func createOrg(t *testing.T, client *http.Client, base, name, slug string) orgDTO {
	t.Helper()
	env := doOK(t, client, http.MethodPost, base+"/v1/organizations", map[string]any{"name": name, "slug": slug})
	var o orgDTO
	mustUnmarshal(t, env.Data, &o)
	return o
}

func createProject(t *testing.T, client *http.Client, base, orgID, name, key string) projectDTO {
	t.Helper()
	env := doOK(t, client, http.MethodPost, base+"/v1/projects", map[string]any{
		"organizationId": orgID, "name": name, "key": key,
	})
	var p projectDTO
	mustUnmarshal(t, env.Data, &p)
	return p
}

func createTask(t *testing.T, client *http.Client, base string, body map[string]any) taskDTO {
	t.Helper()
	env := doOK(t, client, http.MethodPost, base+"/v1/tasks", body)
	var task taskDTO
	mustUnmarshal(t, env.Data, &task)
	return task
}

func moveTask(t *testing.T, client *http.Client, base, id, status string, version int32) taskDTO {
	t.Helper()
	env := doOK(t, client, http.MethodPost, base+"/v1/tasks/"+id+"/move", map[string]any{
		"status": status, "expectedVersion": version,
	})
	var task taskDTO
	mustUnmarshal(t, env.Data, &task)
	return task
}

func inviteMember(t *testing.T, client *http.Client, base, orgID, email, role string) {
	t.Helper()
	doOK(t, client, http.MethodPost, base+"/v1/organizations/"+orgID+"/members", map[string]any{
		"email": email, "role": role,
	})
}

func doOK(t *testing.T, client *http.Client, method, url string, body any) envelope {
	t.Helper()
	env := do(t, client, method, url, body)
	if env.Error != nil {
		t.Fatalf("%s %s: %s %s", method, url, env.Error.Code, env.Error.Message)
	}
	return env
}

func do(t *testing.T, client *http.Client, method, url string, body any) envelope {
	t.Helper()
	var rdr io.Reader
	if body != nil {
		b, err := json.Marshal(body)
		if err != nil {
			t.Fatal(err)
		}
		rdr = bytes.NewReader(b)
	}
	req, err := http.NewRequest(method, url, rdr)
	if err != nil {
		t.Fatal(err)
	}
	if body != nil {
		req.Header.Set("Content-Type", "application/json")
	}
	res, err := client.Do(req)
	if err != nil {
		t.Fatal(err)
	}
	defer res.Body.Close()
	raw, _ := io.ReadAll(res.Body)
	var env envelope
	if err := json.Unmarshal(raw, &env); err != nil {
		t.Fatalf("decode %s: %s", raw, err)
	}
	return env
}

func mustUnmarshal(t *testing.T, raw json.RawMessage, dest any) {
	t.Helper()
	if err := json.Unmarshal(raw, dest); err != nil {
		t.Fatal(err)
	}
}

func uniqueEmail(prefix string) string {
	return prefix + "-" + uuid.NewString()[:8] + "@example.com"
}

func uniqueSlug(prefix string) string {
	return prefix + "-" + uuid.NewString()[:8]
}

type bearerTransport struct{ token string }

func (b bearerTransport) RoundTrip(r *http.Request) (*http.Response, error) {
	r = r.Clone(r.Context())
	r.Header.Set("Authorization", "Bearer "+b.token)
	return http.DefaultTransport.RoundTrip(r)
}

func agentClient(token string) *http.Client {
	return &http.Client{Transport: bearerTransport{token}, Timeout: 10 * time.Second}
}

// TestAgentOwnership covers the self-hosted team loop: a developer issues
// their own agent key, the agent's work is credited to that developer, and a
// manager (viewer) can follow it through activity, search and reports.
func TestAgentOwnership(t *testing.T) {
	pool := testPool(t)
	srv, adminClient := testServer(t, pool)
	_ = register(t, adminClient, srv.URL, "Owner Admin", uniqueEmail("own-admin"), "password123")
	org := createOrg(t, adminClient, srv.URL, "Owners Co", uniqueSlug("owners"))
	project := createProject(t, adminClient, srv.URL, org.ID, "Billing", "BIL")

	devJar, _ := cookiejar.New(nil)
	devClient := &http.Client{Jar: devJar, Timeout: 10 * time.Second}
	dev := register(t, devClient, srv.URL, "Dev Owner", uniqueEmail("own-dev"), "password123")
	inviteMember(t, adminClient, srv.URL, org.ID, dev.Email, "developer")

	viewJar, _ := cookiejar.New(nil)
	viewClient := &http.Client{Jar: viewJar, Timeout: 10 * time.Second}
	viewer := register(t, viewClient, srv.URL, "Manager", uniqueEmail("own-view"), "password123")
	inviteMember(t, adminClient, srv.URL, org.ID, viewer.Email, "viewer")

	type agentDTO struct {
		ID          string `json:"id"`
		DeveloperID string `json:"developerId"`
	}
	type keyDTO struct {
		ID  string `json:"id"`
		Key string `json:"key"`
	}

	// Developer creates their own agent and key.
	env := doOK(t, devClient, http.MethodPost, srv.URL+"/v1/agents", map[string]any{"organizationId": org.ID, "name": "Dev's Claude"})
	var ag agentDTO
	mustUnmarshal(t, env.Data, &ag)
	if ag.DeveloperID != dev.ID {
		t.Fatalf("agent owner = %s, want developer %s", ag.DeveloperID, dev.ID)
	}
	env = doOK(t, devClient, http.MethodPost, srv.URL+"/v1/agents/"+ag.ID+"/api-keys", map[string]any{"name": "laptop"})
	var key keyDTO
	mustUnmarshal(t, env.Data, &key)

	// Developers cannot create agents for others or widen scopes; viewers cannot hold agents.
	if e := do(t, devClient, http.MethodPost, srv.URL+"/v1/agents", map[string]any{"organizationId": org.ID, "name": "x", "developerId": viewer.ID}); e.Error == nil || e.Error.Code != "FORBIDDEN" {
		t.Fatalf("dev creating agent for someone else: %#v", e.Error)
	}
	if e := do(t, devClient, http.MethodPost, srv.URL+"/v1/agents/"+ag.ID+"/api-keys", map[string]any{"scopes": []string{"*"}}); e.Error == nil || e.Error.Code != "VALIDATION" {
		t.Fatalf("wildcard scope: %#v", e.Error)
	}
	if e := do(t, viewClient, http.MethodPost, srv.URL+"/v1/agents", map[string]any{"organizationId": org.ID, "name": "v"}); e.Error == nil || e.Error.Code != "FORBIDDEN" {
		t.Fatalf("viewer creating agent: %#v", e.Error)
	}
	if e := do(t, adminClient, http.MethodPost, srv.URL+"/v1/agents", map[string]any{"organizationId": org.ID, "name": "v", "developerId": viewer.ID}); e.Error == nil || e.Error.Code != "VALIDATION" {
		t.Fatalf("admin assigning agent to viewer: %#v", e.Error)
	}

	// Admin-created agent can be reassigned to the developer.
	env = doOK(t, adminClient, http.MethodPost, srv.URL+"/v1/agents", map[string]any{"organizationId": org.ID, "name": "CI bot"})
	var bot agentDTO
	mustUnmarshal(t, env.Data, &bot)
	env = doOK(t, adminClient, http.MethodPatch, srv.URL+"/v1/agents/"+bot.ID, map[string]any{"developerId": dev.ID})
	mustUnmarshal(t, env.Data, &bot)
	if bot.DeveloperID != dev.ID {
		t.Fatalf("reassigned owner = %s", bot.DeveloperID)
	}
	// Another agent's id cannot be used to revoke this agent's key.
	if e := do(t, adminClient, http.MethodDelete, srv.URL+"/v1/agents/"+bot.ID+"/api-keys/"+key.ID, nil); e.Error == nil {
		t.Fatal("revoked a key through the wrong agent")
	}

	// The agent's task is assigned to and reported by the developer.
	agentHTTP := agentClient(key.Key)
	var task struct {
		ID         string `json:"id"`
		Key        string `json:"key"`
		Version    int32  `json:"version"`
		AssigneeID string `json:"assigneeId"`
		ReporterID string `json:"reporterId"`
	}
	env = doOK(t, agentHTTP, http.MethodPost, srv.URL+"/v1/tasks", map[string]any{
		"organizationId": org.ID, "projectId": project.ID, "title": "Webhook retries",
		"status": "in_progress", "externalRef": "feat/retries",
	})
	mustUnmarshal(t, env.Data, &task)
	if task.AssigneeID != dev.ID || task.ReporterID != dev.ID {
		t.Fatalf("agent task assignee=%s reporter=%s, want %s", task.AssigneeID, task.ReporterID, dev.ID)
	}
	doOK(t, agentHTTP, http.MethodPost, srv.URL+"/v1/tasks/"+task.ID+"/complete", map[string]any{
		"completionSummary": "Done", "acceptanceCriteriaMet": true, "expectedVersion": task.Version,
		"proof": map[string]any{"kind": "none"},
	})

	// Search by task key (BIL-1), case-insensitive.
	var found []taskDTO
	mustUnmarshal(t, doOK(t, agentHTTP, http.MethodGet, srv.URL+"/v1/tasks?organizationId="+org.ID+"&search="+strings.ToLower(task.Key), nil).Data, &found)
	if len(found) != 1 || found[0].ID != task.ID {
		t.Fatalf("search by key %s: %#v", task.Key, found)
	}

	// Manager sees the developer's agent work when asking for that person.
	var acts []map[string]any
	mustUnmarshal(t, doOK(t, viewClient, http.MethodGet, srv.URL+"/v1/tasks/activity?organizationId="+org.ID+"&actorId="+dev.ID, nil).Data, &acts)
	if len(acts) != 0 {
		t.Fatalf("activity without includeAgents should only be the person's own: %d", len(acts))
	}
	mustUnmarshal(t, doOK(t, viewClient, http.MethodGet, srv.URL+"/v1/tasks/activity?organizationId="+org.ID+"&actorId="+dev.ID+"&includeAgents=true", nil).Data, &acts)
	if len(acts) < 2 {
		t.Fatalf("activity with includeAgents: %d rows", len(acts))
	}

	// Report credits the developer, counts the AI completion.
	var rep struct {
		Totals struct {
			Created, Completed, CompletedByAI int
			AvgCycleHours                     *float64
		} `json:"totals"`
		ByPerson []struct {
			ID        *string `json:"id"`
			Completed int     `json:"completed"`
		} `json:"byPerson"`
		ByProject []struct {
			Key       string `json:"key"`
			Completed int    `json:"completed"`
		} `json:"byProject"`
		Weekly    []map[string]any `json:"weekly"`
		Completed []struct {
			Key        string   `json:"key"`
			CycleHours *float64 `json:"cycleHours"`
		} `json:"completed"`
	}
	mustUnmarshal(t, doOK(t, viewClient, http.MethodGet, srv.URL+"/v1/tasks/report?organizationId="+org.ID, nil).Data, &rep)
	if rep.Totals.Created != 1 || rep.Totals.Completed != 1 || rep.Totals.CompletedByAI != 1 || rep.Totals.AvgCycleHours == nil {
		t.Fatalf("report totals: %+v", rep.Totals)
	}
	if len(rep.ByPerson) != 1 || rep.ByPerson[0].ID == nil || *rep.ByPerson[0].ID != dev.ID || rep.ByPerson[0].Completed != 1 {
		t.Fatalf("report by person: %+v", rep.ByPerson)
	}
	if len(rep.ByProject) != 1 || rep.ByProject[0].Key != "BIL" || len(rep.Completed) != 1 || rep.Completed[0].CycleHours == nil {
		t.Fatalf("report projects/completed: %+v %+v", rep.ByProject, rep.Completed)
	}
	if len(rep.Weekly) < 4 {
		t.Fatalf("weekly buckets: %d", len(rep.Weekly))
	}
	// A card a human drags to Done on the board counts as delivered too.
	manual := createTask(t, devClient, srv.URL, map[string]any{"organizationId": org.ID, "projectId": project.ID, "title": "Manual fix"})
	manual = moveTask(t, devClient, srv.URL, manual.ID, "in_progress", manual.Version)
	// Without proof the move is refused; with a link it goes through.
	if env := do(t, devClient, http.MethodPost, srv.URL+"/v1/tasks/"+manual.ID+"/move", map[string]any{
		"status": "done", "expectedVersion": manual.Version,
	}); env.Error == nil || env.Error.Code != "PROOF_REQUIRED" {
		t.Fatalf("expected PROOF_REQUIRED on drag to done, got %#v", env.Error)
	}
	doOK(t, devClient, http.MethodPost, srv.URL+"/v1/tasks/"+manual.ID+"/move", map[string]any{
		"status": "done", "expectedVersion": manual.Version,
		"proof": map[string]any{"kind": "vercel", "url": "https://billing-git-fix.vercel.app"},
	})
	mustUnmarshal(t, doOK(t, viewClient, http.MethodGet, srv.URL+"/v1/tasks/report?organizationId="+org.ID, nil).Data, &rep)
	if rep.Totals.Completed != 2 || rep.Totals.CompletedByAI != 1 || len(rep.Completed) != 2 || rep.Completed[0].CycleHours == nil {
		t.Fatalf("drag-to-done not reported: %+v", rep.Totals)
	}
	if e := do(t, viewClient, http.MethodGet, srv.URL+"/v1/tasks/report?organizationId="+org.ID+"&from=2026-12-01&to=2026-01-01", nil); e.Error == nil {
		t.Fatal("inverted range accepted")
	}
}

const testIssuer = "https://ops.example.test"

func postForm(t *testing.T, endpoint string, form url.Values) (int, map[string]any) {
	t.Helper()
	res, err := http.PostForm(endpoint, form)
	if err != nil {
		t.Fatal(err)
	}
	defer res.Body.Close()
	var body map[string]any
	_ = json.NewDecoder(res.Body).Decode(&body)
	return res.StatusCode, body
}

// TestOAuthMCPFlow walks the browser sign-in an editor does for MCP:
// discovery → client registration → consent → code + PKCE → tokens → API
// calls as the person's agent → refresh rotation → disconnect.
func TestOAuthMCPFlow(t *testing.T) {
	pool := testPool(t)
	srv, adminClient := testServer(t, pool)
	_ = register(t, adminClient, srv.URL, "OAuth Admin", uniqueEmail("oa-admin"), "password123")
	org := createOrg(t, adminClient, srv.URL, "OAuth Co", uniqueSlug("oauth"))
	project := createProject(t, adminClient, srv.URL, org.ID, "Core", "CORE")

	devJar, _ := cookiejar.New(nil)
	devClient := &http.Client{Jar: devJar, Timeout: 10 * time.Second}
	dev := register(t, devClient, srv.URL, "OAuth Dev", uniqueEmail("oa-dev"), "password123")
	inviteMember(t, adminClient, srv.URL, org.ID, dev.Email, "developer")
	viewJar, _ := cookiejar.New(nil)
	viewClient := &http.Client{Jar: viewJar, Timeout: 10 * time.Second}
	viewer := register(t, viewClient, srv.URL, "OAuth Viewer", uniqueEmail("oa-view"), "password123")
	inviteMember(t, adminClient, srv.URL, org.ID, viewer.Email, "viewer")

	// Discovery documents point at the public issuer and the /mcp resource.
	var meta map[string]any
	res, err := http.Get(srv.URL + "/.well-known/oauth-protected-resource/mcp")
	if err != nil {
		t.Fatal(err)
	}
	_ = json.NewDecoder(res.Body).Decode(&meta)
	res.Body.Close()
	if meta["resource"] != testIssuer+"/mcp" {
		t.Fatalf("resource metadata: %v", meta)
	}
	res, _ = http.Get(srv.URL + "/.well-known/oauth-authorization-server")
	_ = json.NewDecoder(res.Body).Decode(&meta)
	res.Body.Close()
	if meta["token_endpoint"] != testIssuer+"/oauth/token" || meta["registration_endpoint"] != testIssuer+"/oauth/register" {
		t.Fatalf("AS metadata: %v", meta)
	}

	regBody, _ := json.Marshal(map[string]any{"client_name": "Claude Code", "redirect_uris": []string{"http://localhost:33418/callback"}})
	res, err = http.Post(srv.URL+"/oauth/register", "application/json", bytes.NewReader(regBody))
	if err != nil || res.StatusCode != http.StatusCreated {
		t.Fatalf("register: %v %v", err, res.StatusCode)
	}
	var client struct {
		ClientID string `json:"client_id"`
	}
	_ = json.NewDecoder(res.Body).Decode(&client)
	res.Body.Close()
	badReg, _ := json.Marshal(map[string]any{"client_name": "Evil", "redirect_uris": []string{"http://evil.example.com/cb"}})
	res, _ = http.Post(srv.URL+"/oauth/register", "application/json", bytes.NewReader(badReg))
	if res.StatusCode != http.StatusBadRequest {
		t.Fatalf("non-loopback http redirect accepted: %d", res.StatusCode)
	}
	res.Body.Close()

	verifier := "a-very-long-pkce-verifier-0123456789-abcdefghijklmnopqrstuvwxyz"
	sum := sha256.Sum256([]byte(verifier))
	challenge := base64.RawURLEncoding.EncodeToString(sum[:])
	// Loopback redirects may come back on a different port (RFC 8252).
	redirect := "http://localhost:51234/callback"
	consent := map[string]any{
		"clientId": client.ClientID, "redirectUri": redirect, "codeChallenge": challenge,
		"codeChallengeMethod": "S256", "state": "xyz", "resource": testIssuer + "/mcp", "organizationId": org.ID,
	}

	if e := do(t, viewClient, http.MethodPost, srv.URL+"/v1/oauth/authorize", consent); e.Error == nil || e.Error.Code != "FORBIDDEN" {
		t.Fatalf("viewer approved an agent: %#v", e.Error)
	}
	wrong := map[string]any{}
	for k, v := range consent {
		wrong[k] = v
	}
	wrong["redirectUri"] = "https://attacker.example/cb"
	if e := do(t, devClient, http.MethodPost, srv.URL+"/v1/oauth/authorize", wrong); e.Error == nil {
		t.Fatal("unregistered redirect accepted")
	}

	var approved struct {
		RedirectTo string `json:"redirectTo"`
		AgentID    string `json:"agentId"`
	}
	mustUnmarshal(t, doOK(t, devClient, http.MethodPost, srv.URL+"/v1/oauth/authorize", consent).Data, &approved)
	back, _ := url.Parse(approved.RedirectTo)
	code := back.Query().Get("code")
	if back.Host != "localhost:51234" || back.Query().Get("state") != "xyz" || back.Query().Get("iss") != testIssuer || code == "" {
		t.Fatalf("redirect: %s", approved.RedirectTo)
	}

	exchange := url.Values{"grant_type": {"authorization_code"}, "code": {code}, "redirect_uri": {redirect}, "client_id": {client.ClientID}}
	exchange.Set("code_verifier", "wrong-verifier-wrong-verifier-wrong-verifier-000")
	if status, body := postForm(t, srv.URL+"/oauth/token", exchange); status != 400 || body["error"] != "invalid_grant" {
		t.Fatalf("bad verifier: %d %v", status, body)
	}
	// The failed attempt burned the code — a stolen code can't be retried.
	exchange.Set("code_verifier", verifier)
	if status, _ := postForm(t, srv.URL+"/oauth/token", exchange); status != 400 {
		t.Fatalf("code reuse after failure: %d", status)
	}

	// Approve again for a fresh code, exchange it properly.
	mustUnmarshal(t, doOK(t, devClient, http.MethodPost, srv.URL+"/v1/oauth/authorize", consent).Data, &approved)
	back, _ = url.Parse(approved.RedirectTo)
	exchange.Set("code", back.Query().Get("code"))
	status, tokens := postForm(t, srv.URL+"/oauth/token", exchange)
	if status != 200 || tokens["token_type"] != "Bearer" {
		t.Fatalf("token exchange: %d %v", status, tokens)
	}
	access, refresh := tokens["access_token"].(string), tokens["refresh_token"].(string)
	if status, _ := postForm(t, srv.URL+"/oauth/token", exchange); status != 400 {
		t.Fatal("authorization code reused")
	}

	// The token acts as the developer's agent: whoami + a task assigned to them.
	agentHTTP := agentClient(access)
	var who struct {
		ActorType, ID, OrganizationID, DeveloperID string
	}
	mustUnmarshal(t, doOK(t, agentHTTP, http.MethodGet, srv.URL+"/v1/auth/whoami", nil).Data, &who)
	if who.ActorType != "agent" || who.DeveloperID != dev.ID || who.OrganizationID != org.ID || who.ID != approved.AgentID {
		t.Fatalf("whoami: %+v", who)
	}
	var task struct{ AssigneeID string }
	mustUnmarshal(t, doOK(t, agentHTTP, http.MethodPost, srv.URL+"/v1/tasks", map[string]any{
		"organizationId": org.ID, "projectId": project.ID, "title": "Via OAuth",
	}).Data, &task)
	if task.AssigneeID != dev.ID {
		t.Fatalf("assignee %s", task.AssigneeID)
	}
	if e := do(t, agentHTTP, http.MethodGet, srv.URL+"/v1/agents?organizationId="+org.ID, nil); e.Error != nil {
		t.Fatalf("agent list: %#v", e.Error)
	}

	// Refresh rotates: the old refresh token stops working.
	status, rotated := postForm(t, srv.URL+"/oauth/token", url.Values{"grant_type": {"refresh_token"}, "refresh_token": {refresh}, "client_id": {client.ClientID}})
	if status != 200 || rotated["access_token"] == access {
		t.Fatalf("refresh: %d %v", status, rotated)
	}
	if status, _ := postForm(t, srv.URL+"/oauth/token", url.Values{"grant_type": {"refresh_token"}, "refresh_token": {refresh}}); status != 400 {
		t.Fatal("refresh token reused")
	}

	// The agents list shows the live connection; disconnecting signs the editor out.
	var agents []struct {
		ID           string  `json:"id"`
		ConnectedApp *string `json:"connectedApp"`
	}
	mustUnmarshal(t, doOK(t, devClient, http.MethodGet, srv.URL+"/v1/agents?organizationId="+org.ID, nil).Data, &agents)
	if len(agents) != 1 || agents[0].ConnectedApp == nil || *agents[0].ConnectedApp != "Claude Code" {
		t.Fatalf("connected agents: %+v", agents)
	}
	doOK(t, devClient, http.MethodPatch, srv.URL+"/v1/agents/"+approved.AgentID, map[string]any{"active": false})
	newAccess := rotated["access_token"].(string)
	if e := do(t, agentClient(newAccess), http.MethodGet, srv.URL+"/v1/auth/whoami", nil); e.Error == nil {
		t.Fatal("token still valid after disconnect")
	}
	if status, _ := postForm(t, srv.URL+"/oauth/token", url.Values{"grant_type": {"refresh_token"}, "refresh_token": {rotated["refresh_token"].(string)}}); status != 400 {
		t.Fatal("refresh still valid after disconnect")
	}

	// Reconnecting reuses the same agent, so history stays in one place.
	mustUnmarshal(t, doOK(t, devClient, http.MethodPost, srv.URL+"/v1/oauth/authorize", consent).Data, &approved)
	if approved.AgentID != agents[0].ID {
		t.Fatalf("reconnect created a new agent: %s vs %s", approved.AgentID, agents[0].ID)
	}

	// Demoting the developer to viewer cuts the agent off.
	back, _ = url.Parse(approved.RedirectTo)
	exchange.Set("code", back.Query().Get("code"))
	_, tokens = postForm(t, srv.URL+"/oauth/token", exchange)
	doOK(t, adminClient, http.MethodPatch, srv.URL+"/v1/organizations/"+org.ID+"/members/"+dev.ID, map[string]any{"role": "viewer"})
	if e := do(t, agentClient(tokens["access_token"].(string)), http.MethodGet, srv.URL+"/v1/auth/whoami", nil); e.Error == nil {
		t.Fatal("agent token works after owner became a viewer")
	}
}
