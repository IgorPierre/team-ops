package api_test

import (
	"bytes"
	"context"
	"encoding/json"
	"io"
	"net/http"
	"net/http/cookiejar"
	"net/http/httptest"
	"os"
	"strings"
	"testing"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/team-ops/api/internal/agents"
	"github.com/team-ops/api/internal/auth"
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

	done := doOK(t, client, http.MethodPost, srv.URL+"/v1/tasks/"+reviewTask.ID+"/complete", map[string]any{
		"completionSummary":     "Shipped with tests.",
		"acceptanceCriteriaMet": true,
		"expectedVersion":       reviewTask.Version,
	})
	var completed taskDTO
	mustUnmarshal(t, done.Data, &completed)
	if completed.Status != "done" {
		t.Fatalf("complete status: %s", completed.Status)
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
	log := logging.Discard()
	authSvc := auth.NewService(pool, "teamops_session", false, 24*time.Hour, log)
	orgSvc := organizations.New(pool)
	projectSvc := projects.New(pool, orgSvc)
	taskSvc := tasks.New(pool, orgSvc)
	agentSvc := agents.New(pool, orgSvc)

	r := chi.NewRouter()
	r.Use(authSvc.Middleware)
	r.Route("/v1", func(r chi.Router) {
		r.Mount("/auth", authSvc.Routes())
		r.Group(func(r chi.Router) {
			r.Use(authSvc.RequireUser)
			r.Mount("/organizations", orgSvc.Routes())
			r.Mount("/projects", projectSvc.Routes())
			r.Mount("/tasks", taskSvc.Routes())
			r.Mount("/agents", agentSvc.Routes())
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
	Title   string `json:"title"`
	Status  string `json:"status"`
	Version int32  `json:"version"`
}

func register(t *testing.T, client *http.Client, base, name, email, password string) userDTO {
	t.Helper()
	env := doOK(t, client, http.MethodPost, base+"/v1/auth/register", map[string]any{
		"name": name, "email": email, "password": password,
	})
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
