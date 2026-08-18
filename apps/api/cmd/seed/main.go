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
		return fmt.Errorf("hash seed password: %w", err)
	}

	alex, err := upsertUser(ctx, q, "Alex Rivera", "alex@example.com", hash)
	if err != nil {
		return fmt.Errorf("seed user alex: %w", err)
	}
	maria, err := upsertUser(ctx, q, "Maria Chen", "maria@example.com", hash)
	if err != nil {
		return fmt.Errorf("seed user maria: %w", err)
	}
	joao, err := upsertUser(ctx, q, "João Silva", "joao@example.com", hash)
	if err != nil {
		return fmt.Errorf("seed user joao: %w", err)
	}
	carla, err := upsertUser(ctx, q, "Carla Mendes", "carla@example.com", hash)
	if err != nil {
		return fmt.Errorf("seed user carla: %w", err)
	}

	north, err := upsertOrg(ctx, q, "Northwind Labs", "northwind", "#2563eb")
	if err != nil {
		return fmt.Errorf("seed org northwind: %w", err)
	}
	atlas, err := upsertOrg(ctx, q, "Atlas Health", "atlas-health", "#059669")
	if err != nil {
		return fmt.Errorf("seed org atlas: %w", err)
	}
	harbor, err := upsertOrg(ctx, q, "Harbor Freight", "harbor", "#d97706")
	if err != nil {
		return fmt.Errorf("seed org harbor: %w", err)
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
		return fmt.Errorf("seed project SITE: %w", err)
	}
	erp, err := upsertProject(ctx, q, north.ID, "ERP", "ERP", "Internal operations platform.")
	if err != nil {
		return fmt.Errorf("seed project ERP: %w", err)
	}
	app, err := upsertProject(ctx, q, north.ID, "Mobile App", "APP", "Customer iOS/Android app.")
	if err != nil {
		return fmt.Errorf("seed project APP: %w", err)
	}
	crm, err := upsertProject(ctx, q, atlas.ID, "Clinic CRM", "CRM", "Patient relationship tools.")
	if err != nil {
		return fmt.Errorf("seed project CRM: %w", err)
	}
	apiP, err := upsertProject(ctx, q, atlas.ID, "Health API", "API", "FHIR-facing service.")
	if err != nil {
		return fmt.Errorf("seed project API: %w", err)
	}
	wh, err := upsertProject(ctx, q, harbor.ID, "Warehouse", "WH", "Inventory and picking.")
	if err != nil {
		return fmt.Errorf("seed project WH: %w", err)
	}

	agent, err := upsertAgent(ctx, q, north.ID, alex.ID, "Claude Code / Alex", "Local coding agent used by Alex.")
	if err != nil {
		return fmt.Errorf("seed agent: %w", err)
	}

	type spec struct {
		org, project uuid.UUID
		title        string
		desc         string
		ac           string
		status       string
		priority     string
		assignee     *uuid.UUID
		source       string
		blocked      bool
		reason       *string
		ext          *string
		due          string
		pos          int64
		comment      *string
	}

	tasks := []spec{
		// Northwind ERP: the board to drag around locally.
		{north.ID, erp.ID, "Retry failed webhook deliveries", "Queue 24h of failed invoice webhooks and replay with backoff.", "A failed delivery retries 3 times, then lands in a dead-letter list.", "backlog", "high", &maria.ID, "manual", false, nil, strPtr("seed:erp-webhook-retry"), "2026-08-25", 1000, nil},
		{north.ID, erp.ID, "Add audit log export", "CSV export of activity for compliance.", "Finance can download a CSV of task activity for a date range.", "backlog", "medium", &maria.ID, "manual", false, nil, strPtr("seed:erp-audit-export"), "2026-09-01", 2000, nil},
		{north.ID, erp.ID, "Replace spreadsheet SKU import", "The ops team still pastes SKUs into a sheet. Move that into a CSV upload on the ERP.", "Upload rejects bad rows and shows a preview before commit.", "backlog", "medium", &joao.ID, "manual", false, nil, strPtr("seed:erp-sku-import"), "2026-09-08", 3000, strPtr("Ops still uses the sheet as source of truth until this ships.")},
		{north.ID, erp.ID, "Investigate slow invoices list", "List takes 4s with 20k rows. Check indexes before rewriting the query.", "p95 for GET /invoices drops under 400ms on staging.", "backlog", "high", nil, "manual", false, nil, strPtr("seed:erp-slow-invoices"), "2026-08-21", 4000, nil},
		{north.ID, erp.ID, "Document month-end close runbook", "Write the steps finance actually runs, not the ones in the wiki from 2024.", "Runbook lives in the repo and names the screens, not the old Confluence page.", "backlog", "low", &carla.ID, "manual", false, nil, strPtr("seed:erp-close-runbook"), "", 5000, nil},
		{north.ID, erp.ID, "SSO groundwork", "Prepare OIDC config without enabling it.", "Config parses and fails closed. Feature flag stays off.", "backlog", "low", nil, "manual", false, nil, strPtr("seed:erp-sso"), "", 6000, nil},
		{north.ID, erp.ID, "Vendor credit notes", "Allow a negative line on an open invoice when a supplier overcharged.", "Credit note keeps the original invoice number in the audit trail.", "backlog", "medium", &maria.ID, "manual", false, nil, strPtr("seed:erp-credit-notes"), "2026-09-12", 7000, nil},

		{north.ID, erp.ID, "Implement authentication", "Email/password sessions for the ERP console.", "Login, logout, and a rejected session on a bad password.", "in_progress", "high", &joao.ID, "ai", false, nil, strPtr("seed:erp-auth"), "2026-08-20", 1000, nil},
		{north.ID, erp.ID, "Wire expectedVersion on invoice edits", "Stop last-write-wins on the invoice drawer.", "A stale tab gets TASK_VERSION_CONFLICT and the drawer reloads.", "in_progress", "high", &alex.ID, "ai", false, nil, strPtr("seed:erp-invoice-version"), "2026-08-19", 2000, nil},
		{north.ID, erp.ID, "MCP: list invoices tool", "Expose listInvoices so the agent can find a bill without dumping SQL.", "Tool returns the same fields the UI table shows. No Postgres from the agent.", "in_progress", "medium", &alex.ID, "ai", false, nil, strPtr("seed:erp-mcp-invoices"), "2026-08-22", 3000, nil},
		{north.ID, erp.ID, "Sync supplier catalog nightly", "Pull the supplier feed at 02:00. Currently blocked on their sandbox key.", "Job logs success/fail. A missed night is visible on the board.", "in_progress", "medium", &joao.ID, "integration", true, strPtr("Waiting on a sandbox key from the supplier."), strPtr("seed:erp-supplier-sync"), "2026-08-28", 4000, strPtr("I pinged them yesterday. Still no key.")},

		{north.ID, erp.ID, "Fix invoice rounding", "Totals drift by 0.01 on BRL invoices.", "Golden fixtures for 0, 1, and 3 decimal SKUs all match.", "review", "high", &joao.ID, "ai", false, nil, strPtr("seed:erp-invoice-rounding"), "2026-08-18", 1000, nil},
		{north.ID, erp.ID, "Permission matrix for finance roles", "Viewer can read invoices. Developer cannot post a close.", "Table in the PR lists each role against each invoice action.", "review", "medium", &maria.ID, "manual", false, nil, strPtr("seed:erp-finance-perms"), "2026-08-19", 2000, strPtr("Ready for Alex to glance at the table.")},
		{north.ID, erp.ID, "Empty state for unpaid invoices", "Blank table looks broken. Add a short empty state.", "Empty state has one sentence and a button to create an invoice.", "review", "low", &carla.ID, "manual", false, nil, strPtr("seed:erp-empty-unpaid"), "", 3000, nil},

		{north.ID, erp.ID, "Archive FY25 ledgers", "Move closed books to cold storage.", "FY25 is read-only in the UI.", "done", "low", &maria.ID, "manual", false, nil, strPtr("seed:erp-fy25"), "", 1000, nil},
		{north.ID, erp.ID, "Seed chart of accounts", "Default accounts for a new Northwind company.", "New org starts with the 12 accounts finance asked for.", "done", "medium", &alex.ID, "manual", false, nil, strPtr("seed:erp-coa"), "", 2000, nil},
		{north.ID, erp.ID, "Add /readyz health check", "Load balancer needs more than /healthz.", "/readyz fails when Postgres is down.", "done", "medium", &joao.ID, "ai", false, nil, strPtr("seed:erp-readyz"), "", 3000, nil},
		{north.ID, erp.ID, "BRL currency formatting", "Use pt-BR grouping on every money field.", "Invoice total, list, and PDF all show the same string.", "done", "low", &carla.ID, "manual", false, nil, strPtr("seed:erp-brl-format"), "", 4000, nil},

		// Website
		{north.ID, site.ID, "Rewrite homepage hero", "Lead with self-hosted + agents.", "Hero states the board is something agents can write to.", "backlog", "high", &alex.ID, "manual", false, nil, strPtr("seed:site-hero"), "2026-08-22", 1000, nil},
		{north.ID, site.ID, "Status page snippet", "Embed healthz on the public site.", "Snippet hits /healthz and does not ship a fake uptime number.", "backlog", "low", &carla.ID, "manual", false, nil, strPtr("seed:site-status"), "", 2000, nil},
		{north.ID, site.ID, "FAQ: where Postgres lives", "Answer without promising a Team-Ops cloud.", "FAQ names Docker, RDS, Neon, and a VM.", "backlog", "medium", &maria.ID, "manual", false, nil, strPtr("seed:site-faq-postgres"), "2026-08-24", 3000, nil},
		{north.ID, site.ID, "Publish MCP docs", "Install instructions for Cursor and Claude.", "A reader can copy the mcp.json and set TEAM_OPS_URL.", "in_progress", "high", &maria.ID, "ai", false, nil, strPtr("seed:site-mcp-docs"), "2026-08-19", 1000, nil},
		{north.ID, site.ID, "Trim marketing adjectives", "Cut words we cannot back with a metric.", "No invented user counts on the homepage.", "in_progress", "low", &alex.ID, "manual", false, nil, strPtr("seed:site-copy-pass"), "2026-08-20", 2000, nil},
		{north.ID, site.ID, "Add dark mode screenshots", "Capture board in both themes.", "Docs show light and dark of the same board.", "review", "low", &carla.ID, "manual", false, nil, strPtr("seed:site-screenshots"), "", 1000, nil},
		{north.ID, site.ID, "Set up custom domain", "teamops.example.com via Caddy.", "TLS terminates at Caddy. App stays on HTTP inside the network.", "done", "medium", &alex.ID, "manual", false, nil, strPtr("seed:site-domain"), "", 1000, nil},

		// Mobile
		{north.ID, app.ID, "Offline task cache", "Read last board snapshot without network.", "Opening the app in airplane mode shows the last snapshot with a stale banner.", "backlog", "medium", &joao.ID, "manual", false, nil, strPtr("seed:app-offline"), "2026-09-10", 1000, nil},
		{north.ID, app.ID, "Push deep links", "Open a task drawer from a notification.", "Tapping the push opens the same task the notification named.", "backlog", "low", nil, "manual", false, nil, strPtr("seed:app-deeplink"), "", 2000, nil},
		{north.ID, app.ID, "Biometric unlock", "Optional Face ID for the mobile client.", "Toggle is off by default. Failed Face ID falls back to the session password.", "in_progress", "medium", &maria.ID, "ai", true, strPtr("Waiting on store review account."), strPtr("seed:app-biometric"), "2026-08-28", 1000, nil},
		{north.ID, app.ID, "Release 0.3 to TestFlight", "Cut the build after auth lands.", "Build is uploaded. Testers can install from TestFlight.", "review", "high", &alex.ID, "integration", false, nil, strPtr("seed:app-testflight"), "2026-08-21", 1000, nil},

		// Atlas
		{atlas.ID, crm.ID, "Patient timeline", "Show visits and notes in one column.", "A clinician sees visits newest first without leaving the patient.", "backlog", "high", &maria.ID, "manual", false, nil, strPtr("seed:crm-timeline"), "2026-08-30", 1000, nil},
		{atlas.ID, crm.ID, "HL7 ingest retry", "Dead-letter queue for failed messages.", "A poisoned message does not block the rest of the queue.", "in_progress", "high", &alex.ID, "ai", false, nil, strPtr("seed:crm-hl7-retry"), "", 1000, nil},
		{atlas.ID, crm.ID, "Export visit PDF", "Clinician-signed summary.", "PDF includes the visit time and the clinician name.", "done", "medium", &maria.ID, "manual", false, nil, strPtr("seed:crm-visit-pdf"), "", 1000, nil},
		{atlas.ID, apiP.ID, "OAuth client credentials", "Machine-to-machine tokens for clinics.", "A clinic can mint a token without a human in the loop.", "review", "high", &maria.ID, "ai", false, nil, strPtr("seed:api-oauth"), "2026-08-17", 1000, nil},
		{atlas.ID, apiP.ID, "Rate limit headers", "Return remaining quota on every response.", "X-RateLimit-Remaining is present on 200 and 429.", "done", "medium", &alex.ID, "manual", false, nil, strPtr("seed:api-ratelimit"), "", 1000, nil},

		// Harbor
		{harbor.ID, wh.ID, "Barcode scanner mode", "Full-screen scan for receiving.", "Scan stays in the foreground until the operator dismisses it.", "backlog", "medium", &joao.ID, "manual", false, nil, strPtr("seed:wh-scanner"), "2026-09-05", 1000, nil},
		{harbor.ID, wh.ID, "Cycle count variance", "Flag bins off by more than 2%.", "Variance list is sorted by absolute miss, not SKU name.", "in_progress", "high", &joao.ID, "ai", false, nil, strPtr("seed:wh-cycle-count"), "2026-08-24", 1000, nil},
		{harbor.ID, wh.ID, "Printer profiles", "Map docks to label printers.", "Dock 3 prints on the Zebra next to receiving.", "done", "low", &alex.ID, "manual", false, nil, strPtr("seed:wh-printers"), "", 1000, nil},
	}

	existing, err := existingTitles(ctx, q, []uuid.UUID{north.ID, atlas.ID, harbor.ID})
	if err != nil {
		return err
	}

	created := 0
	skipped := 0
	for _, t := range tasks {
		if _, ok := existing[t.project][t.title]; ok {
			skipped++
			continue
		}
		n, err := q.IncrementProjectTaskCounter(ctx, t.project)
		if err != nil {
			return fmt.Errorf("increment task counter: %w", err)
		}
		var due pgtype.Date
		if t.due != "" {
			tm, err := time.Parse("2006-01-02", t.due)
			if err != nil {
				return fmt.Errorf("parse due date for %q: %w", t.title, err)
			}
			due = pgtype.Date{Time: tm, Valid: true}
		}
		ac := t.ac
		if ac == "" {
			ac = "Covered by the description. Ship with tests."
		}
		task, err := q.CreateTask(ctx, db.CreateTaskParams{
			Number:             n,
			OrganizationID:     t.org,
			ProjectID:          t.project,
			Title:              t.title,
			Description:        t.desc,
			AcceptanceCriteria: ac,
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
			if database.IsUniqueViolation(err) {
				skipped++
				continue
			}
			return fmt.Errorf("create task %q: %w", t.title, err)
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
		if t.comment != nil {
			_, _ = q.CreateComment(ctx, db.CreateCommentParams{
				TaskID:     task.ID,
				AuthorType: "user",
				AuthorID:   &joao.ID,
				Content:    *t.comment,
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
				Content:    "Opened a branch and added tests. Waiting on review.",
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
	fmt.Printf("seeded %d tasks (%d already present)\n", created, skipped)
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

func upsertAgent(ctx context.Context, q *db.Queries, org, developer uuid.UUID, name, desc string) (db.Agent, error) {
	agents, err := q.ListAgentsByOrganization(ctx, &org)
	if err != nil {
		return db.Agent{}, err
	}
	for _, a := range agents {
		if a.Name == name {
			return a, nil
		}
	}
	return q.CreateAgent(ctx, db.CreateAgentParams{
		Name:           name,
		DeveloperID:    &developer,
		OrganizationID: &org,
		Description:    &desc,
	})
}

func existingTitles(ctx context.Context, q *db.Queries, orgs []uuid.UUID) (map[uuid.UUID]map[string]struct{}, error) {
	out := map[uuid.UUID]map[string]struct{}{}
	for _, org := range orgs {
		tasks, err := q.ListTasks(ctx, db.ListTasksParams{OrganizationID: org})
		if err != nil {
			return nil, fmt.Errorf("list tasks for seed skip: %w", err)
		}
		for _, t := range tasks {
			if out[t.ProjectID] == nil {
				out[t.ProjectID] = map[string]struct{}{}
			}
			out[t.ProjectID][t.Title] = struct{}{}
		}
	}
	return out, nil
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
