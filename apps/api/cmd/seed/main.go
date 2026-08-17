package main

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/shopspring/decimal"

	"github.com/team-ops/api/internal/auth"
	"github.com/team-ops/api/internal/db"
	"github.com/team-ops/api/platform/config"
	"github.com/team-ops/api/platform/database"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		fatal(err)
	}
	ctx := context.Background()
	pool, err := database.Connect(ctx, cfg.DatabaseURL)
	if err != nil {
		fatal(err)
	}
	defer pool.Close()
	q := db.New(pool)
	if err := seed(ctx, q); err != nil {
		fatal(err)
	}
	fmt.Println("Seed complete. Demo login: alex@example.com / password123")
}

func seed(ctx context.Context, q *db.Queries) error {
	hash, err := auth.HashPassword("password123")
	if err != nil {
		return err
	}

	alex, err := upsertUser(ctx, q, "Alex Rivera", "alex@example.com", hash)
	if err != nil {
		return err
	}
	maria, err := upsertUser(ctx, q, "Maria Chen", "maria@example.com", hash)
	if err != nil {
		return err
	}
	joao, err := upsertUser(ctx, q, "João Silva", "joao@example.com", hash)
	if err != nil {
		return err
	}
	carla, err := upsertUser(ctx, q, "Carla Mendes", "carla@example.com", hash)
	if err != nil {
		return err
	}

	north, err := upsertOrg(ctx, q, "Northwind Labs", "northwind", "#2563eb")
	if err != nil {
		return err
	}
	atlas, err := upsertOrg(ctx, q, "Atlas Health", "atlas-health", "#059669")
	if err != nil {
		return err
	}
	harbor, err := upsertOrg(ctx, q, "Harbor Freight", "harbor", "#d97706")
	if err != nil {
		return err
	}

	for _, m := range []struct {
		org  uuid.UUID
		user uuid.UUID
		role string
	}{
		{north.ID, alex.ID, "admin"},
		{north.ID, maria.ID, "developer"},
		{north.ID, joao.ID, "developer"},
		{north.ID, carla.ID, "viewer"},
		{atlas.ID, alex.ID, "admin"},
		{atlas.ID, maria.ID, "developer"},
		{harbor.ID, alex.ID, "admin"},
		{harbor.ID, joao.ID, "developer"},
	} {
		_, _ = q.AddOrganizationMember(ctx, db.AddOrganizationMemberParams{
			OrganizationID: m.org,
			UserID:         m.user,
			Role:           m.role,
		})
	}

	site, err := upsertProject(ctx, q, north.ID, "Website", "SITE", "Marketing site and docs.")
	if err != nil {
		return err
	}
	erp, err := upsertProject(ctx, q, north.ID, "ERP", "ERP", "Internal operations platform.")
	if err != nil {
		return err
	}
	app, err := upsertProject(ctx, q, north.ID, "Mobile App", "APP", "Customer iOS/Android app.")
	if err != nil {
		return err
	}
	crm, err := upsertProject(ctx, q, atlas.ID, "Clinic CRM", "CRM", "Patient relationship tools.")
	if err != nil {
		return err
	}
	apiP, err := upsertProject(ctx, q, atlas.ID, "Health API", "API", "FHIR-facing service.")
	if err != nil {
		return err
	}
	wh, err := upsertProject(ctx, q, harbor.ID, "Warehouse", "WH", "Inventory and picking.")
	if err != nil {
		return err
	}

	agent, err := q.CreateAgent(ctx, db.CreateAgentParams{
		Name:           "Claude Code / Alex",
		DeveloperID:    &alex.ID,
		OrganizationID: &north.ID,
		Description:    strPtr("Local coding agent used by Alex."),
	})
	if err != nil {
		return err
	}

	type spec struct {
		org, project uuid.UUID
		title        string
		desc         string
		status       string
		priority     string
		assignee     *uuid.UUID
		source       string
		blocked      bool
		reason       *string
		ext          *string
		due          string
		pos          int64
	}

	tasks := []spec{
		{north.ID, erp.ID, "Implement authentication", "Email/password sessions for the ERP console.", "in_progress", "high", &joao.ID, "ai", false, nil, strPtr("branch-feature-auth"), "2026-08-20", 1000},
		{north.ID, erp.ID, "Add audit log export", "CSV export of activity for compliance.", "backlog", "medium", &maria.ID, "manual", false, nil, nil, "2026-09-01", 2000},
		{north.ID, erp.ID, "Fix invoice rounding", "Totals drift by 0.01 on BRL invoices.", "review", "high", &joao.ID, "ai", false, nil, strPtr("github-issue-182"), "2026-08-18", 1000},
		{north.ID, erp.ID, "Archive FY25 ledgers", "Move closed books to cold storage.", "done", "low", &maria.ID, "manual", false, nil, nil, "", 1000},
		{north.ID, site.ID, "Rewrite homepage hero", "Lead with self-hosted + agents.", "backlog", "high", &alex.ID, "manual", false, nil, nil, "2026-08-22", 1000},
		{north.ID, site.ID, "Publish MCP docs", "Install instructions for Cursor and Claude.", "in_progress", "high", &maria.ID, "ai", false, nil, strPtr("docs-mcp"), "2026-08-19", 1000},
		{north.ID, site.ID, "Add dark mode screenshots", "Capture board in both themes.", "review", "low", &carla.ID, "manual", false, nil, nil, "", 1000},
		{north.ID, site.ID, "Set up custom domain", "teamops.example.com via Caddy.", "done", "medium", &alex.ID, "manual", false, nil, nil, "", 1000},
		{north.ID, app.ID, "Offline task cache", "Read last board snapshot without network.", "backlog", "medium", &joao.ID, "manual", false, nil, nil, "2026-09-10", 1000},
		{north.ID, app.ID, "Push deep links", "Open a task drawer from a notification.", "backlog", "low", nil, "manual", false, nil, nil, "", 2000},
		{north.ID, app.ID, "Biometric unlock", "Optional Face ID for the mobile client.", "in_progress", "medium", &maria.ID, "ai", true, strPtr("Waiting on store review account."), strPtr("linear-441"), "2026-08-28", 1000},
		{north.ID, app.ID, "Release 0.3 to TestFlight", "Cut the build after auth lands.", "review", "high", &alex.ID, "integration", false, nil, nil, "2026-08-21", 1000},
		{atlas.ID, crm.ID, "Patient timeline", "Show visits and notes in one column.", "backlog", "high", &maria.ID, "manual", false, nil, nil, "2026-08-30", 1000},
		{atlas.ID, crm.ID, "HL7 ingest retry", "Dead-letter queue for failed messages.", "in_progress", "high", &alex.ID, "ai", false, nil, strPtr("agent-hl7-retry"), "", 1000},
		{atlas.ID, apiP.ID, "OAuth client credentials", "Machine-to-machine tokens for clinics.", "review", "high", &maria.ID, "ai", false, nil, nil, "2026-08-17", 1000},
		{atlas.ID, apiP.ID, "Rate limit headers", "Return remaining quota on every response.", "done", "medium", &alex.ID, "manual", false, nil, nil, "", 1000},
		{harbor.ID, wh.ID, "Barcode scanner mode", "Full-screen scan for receiving.", "backlog", "medium", &joao.ID, "manual", false, nil, nil, "2026-09-05", 1000},
		{harbor.ID, wh.ID, "Cycle count variance", "Flag bins off by more than 2%.", "in_progress", "high", &joao.ID, "ai", false, nil, strPtr("branch-cycle-count"), "2026-08-24", 1000},
		{harbor.ID, wh.ID, "Printer profiles", "Map docks to label printers.", "done", "low", &alex.ID, "manual", false, nil, nil, "", 1000},
		{north.ID, erp.ID, "SSO groundwork", "Prepare OIDC config without enabling it.", "backlog", "low", nil, "manual", false, nil, nil, "", 3000},
		{north.ID, site.ID, "Status page snippet", "Embed healthz on the public site.", "backlog", "low", &carla.ID, "manual", false, nil, nil, "", 3000},
		{atlas.ID, crm.ID, "Export visit PDF", "Clinician-signed summary.", "done", "medium", &maria.ID, "manual", false, nil, nil, "", 1000},
	}

	created := 0
	for _, t := range tasks {
		n, err := q.IncrementProjectTaskCounter(ctx, t.project)
		if err != nil {
			return err
		}
		var due pgtype.Date
		if t.due != "" {
			tm, _ := time.Parse("2006-01-02", t.due)
			due = pgtype.Date{Time: tm, Valid: true}
		}
		task, err := q.CreateTask(ctx, db.CreateTaskParams{
			Number:             n,
			OrganizationID:     t.org,
			ProjectID:          t.project,
			Title:              t.title,
			Description:        t.desc,
			AcceptanceCriteria: "Covered by the description. Ship with tests.",
			Status:             t.status,
			Priority:           t.priority,
			AssigneeID:         t.assignee,
			ReporterID:         &alex.ID,
			DueDate:            due,
			Position:           decimal.NewFromInt(t.pos),
			Blocked:            t.blocked,
			BlockedReason:      t.reason,
			Source:             t.source,
			ExternalRef:        t.ext,
			SourceMetadata:     json.RawMessage(`{}`),
		})
		if err != nil {
			continue
		}
		created++
		_, _ = q.CreateActivity(ctx, db.CreateActivityParams{
			TaskID:    task.ID,
			ActorType: "user",
			ActorID:   &alex.ID,
			Action:    "task.created",
			OldValue:  nil,
			NewValue:  []byte(`{"status":"` + t.status + `"}`),
			Metadata:  []byte(`{}`),
		})
		if t.status != "backlog" {
			_, _ = q.CreateActivity(ctx, db.CreateActivityParams{
				TaskID:    task.ID,
				ActorType: pickActorType(t.source),
				ActorID:   pickActor(t.source, alex.ID, agent.ID),
				Action:    "task.moved",
				OldValue:  []byte(`{"status":"backlog"}`),
				NewValue:  []byte(`{"status":"` + t.status + `"}`),
				Metadata:  []byte(`{}`),
			})
		}
		if created%4 == 0 {
			_, _ = q.CreateComment(ctx, db.CreateCommentParams{
				TaskID:     task.ID,
				AuthorType: "user",
				AuthorID:   &joao.ID,
				Content:    "I'll pick this up after the current review.",
				Metadata:   json.RawMessage(`{}`),
			})
			_, _ = q.CreateActivity(ctx, db.CreateActivityParams{
				TaskID:    task.ID,
				ActorType: "user",
				ActorID:   &joao.ID,
				Action:    "comment.created",
				Metadata:  []byte(`{}`),
			})
		}
		if t.source == "ai" {
			_, _ = q.CreateComment(ctx, db.CreateCommentParams{
				TaskID:     task.ID,
				AuthorType: "agent",
				AuthorID:   &agent.ID,
				Content:    "Progress: opened a branch and added tests. Waiting on review.",
				Metadata:   json.RawMessage(`{"tests":"passing"}`),
			})
			_, _ = q.CreateActivity(ctx, db.CreateActivityParams{
				TaskID:    task.ID,
				ActorType: "agent",
				ActorID:   &agent.ID,
				Action:    "task.progress_reported",
				NewValue:  []byte(`{"tests":"passing"}`),
				Metadata:  []byte(`{"tests":"passing"}`),
			})
		}
	}
	fmt.Printf("seeded %d tasks\n", created)
	return nil
}

func upsertUser(ctx context.Context, q *db.Queries, name, email, hash string) (db.User, error) {
	u, err := q.GetUserByEmail(ctx, email)
	if err == nil {
		return u, nil
	}
	return q.CreateUser(ctx, db.CreateUserParams{Name: name, Email: email, PasswordHash: hash})
}

func upsertOrg(ctx context.Context, q *db.Queries, name, slug, color string) (db.Organization, error) {
	o, err := q.GetOrganizationBySlug(ctx, slug)
	if err == nil {
		return o, nil
	}
	return q.CreateOrganization(ctx, db.CreateOrganizationParams{Name: name, Slug: slug, Color: &color})
}

func upsertProject(ctx context.Context, q *db.Queries, org uuid.UUID, name, key, desc string) (db.Project, error) {
	p, err := q.GetProjectByOrgAndKey(ctx, db.GetProjectByOrgAndKeyParams{OrganizationID: org, Key: key})
	if err == nil {
		return p, nil
	}
	return q.CreateProject(ctx, db.CreateProjectParams{OrganizationID: org, Name: name, Key: key, Description: desc})
}

func pickActorType(source string) string {
	if source == "ai" {
		return "agent"
	}
	return "user"
}

func pickActor(source string, user, agent uuid.UUID) *uuid.UUID {
	if source == "ai" {
		return &agent
	}
	return &user
}

func strPtr(s string) *string { return &s }

func fatal(err error) {
	fmt.Fprintln(os.Stderr, err)
	os.Exit(1)
}
