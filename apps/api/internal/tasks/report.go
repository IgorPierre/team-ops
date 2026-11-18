package tasks

import (
	"net/http"
	"sort"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"

	"github.com/team-ops/api/internal/apperr"
	"github.com/team-ops/api/internal/auth"
	"github.com/team-ops/api/internal/db"
	httpx "github.com/team-ops/api/platform/http"
)

const (
	defaultReportDays = 30
	maxReportDays     = 366
	dateLayout        = "2006-01-02"
)

// ReportCounts are the numbers shown for the whole organization and per group.
type ReportCounts struct {
	Created          int      `json:"created"`
	Completed        int      `json:"completed"`
	CompletedByAI    int      `json:"completedByAi"`
	Open             int      `json:"open"`
	InProgress       int      `json:"inProgress"`
	Review           int      `json:"review"`
	Blocked          int      `json:"blocked"`
	Overdue          int      `json:"overdue"`
	AvgCycleHours    *float64 `json:"avgCycleHours"`
	MedianCycleHours *float64 `json:"medianCycleHours"`
}

type ReportGroup struct {
	ID *uuid.UUID `json:"id"`
	ReportCounts
}

type ReportProject struct {
	ID  uuid.UUID `json:"id"`
	Key string    `json:"key"`
	ReportCounts
}

type ReportWeek struct {
	WeekStart string `json:"weekStart"`
	Created   int    `json:"created"`
	Completed int    `json:"completed"`
}

type ReportTask struct {
	ID                uuid.UUID  `json:"id"`
	Key               string     `json:"key"`
	Title             string     `json:"title"`
	ProjectID         uuid.UUID  `json:"projectId"`
	Status            string     `json:"status"`
	Priority          string     `json:"priority"`
	Source            string     `json:"source"`
	Blocked           bool       `json:"blocked"`
	AssigneeID        *uuid.UUID `json:"assigneeId"`
	CreatedAt         time.Time  `json:"createdAt"`
	StartedAt         *time.Time `json:"startedAt"`
	CompletedAt       *time.Time `json:"completedAt"`
	DueDate           *string    `json:"dueDate"`
	CycleHours        *float64   `json:"cycleHours"`
	CompletionSummary *string    `json:"completionSummary"`
}

type ReportDTO struct {
	From      string          `json:"from"`
	To        string          `json:"to"`
	Totals    ReportCounts    `json:"totals"`
	ByPerson  []ReportGroup   `json:"byPerson"`
	ByProject []ReportProject `json:"byProject"`
	Weekly    []ReportWeek    `json:"weekly"`
	Completed []ReportTask    `json:"completed"`
	Open      []ReportTask    `json:"open"`
}

// tally accumulates counts plus the cycle times needed for avg/median.
type tally struct {
	ReportCounts
	cycles []float64
}

func (t *tally) finish() ReportCounts {
	c := t.ReportCounts
	if n := len(t.cycles); n > 0 {
		sort.Float64s(t.cycles)
		sum := 0.0
		for _, h := range t.cycles {
			sum += h
		}
		avg := round1(sum / float64(n))
		med := t.cycles[n/2]
		if n%2 == 0 {
			med = (t.cycles[n/2-1] + t.cycles[n/2]) / 2
		}
		med = round1(med)
		c.AvgCycleHours, c.MedianCycleHours = &avg, &med
	}
	return c
}

func round1(f float64) float64 { return float64(int64(f*10+0.5)) / 10 }

func parseDay(raw string, fallback time.Time) (time.Time, error) {
	if raw == "" {
		return fallback, nil
	}
	return time.ParseInLocation(dateLayout, raw, time.UTC)
}

// report serves GET /v1/tasks/report?organizationId=…[&from=YYYY-MM-DD][&to=YYYY-MM-DD][&projectId=…][&assigneeId=…]
//
// Delivery numbers for a period: what was created and finished, by whom, in
// which project, how long work took (first move to In progress → Done), and
// what is still open. "By whom" is the assignee — agent-created tasks are
// assigned to the developer who owns the agent.
func (s *Service) report(w http.ResponseWriter, r *http.Request) {
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
	if _, _, err := s.orgs.Authorize(r.Context(), a, orgID); err != nil {
		httpx.Error(w, err)
		return
	}
	if a.IsAgent() && !a.HasScope("tasks:read") {
		httpx.Error(w, apperr.New("FORBIDDEN", "Missing tasks:read scope.", http.StatusForbidden))
		return
	}

	today := time.Now().UTC().Truncate(24 * time.Hour)
	to, err1 := parseDay(q.Get("to"), today)
	from, err2 := parseDay(q.Get("from"), to.AddDate(0, 0, -(defaultReportDays-1)))
	if err1 != nil || err2 != nil {
		httpx.Error(w, apperr.New("VALIDATION", "from and to must be YYYY-MM-DD.", http.StatusBadRequest))
		return
	}
	if to.Before(from) {
		httpx.Error(w, apperr.New("VALIDATION", "from must be on or before to.", http.StatusBadRequest))
		return
	}
	if to.Sub(from) > maxReportDays*24*time.Hour {
		httpx.Error(w, apperr.New("VALIDATION", "The report range is limited to one year.", http.StatusBadRequest))
		return
	}
	end := to.AddDate(0, 0, 1) // exclusive

	params := db.ListReportTasksParams{
		OrganizationID: orgID,
		Since:          pgtype.Timestamptz{Time: from, Valid: true},
	}
	var assigneeFilter *uuid.UUID
	for key, dst := range map[string]**uuid.UUID{"projectId": &params.ProjectID, "assigneeId": &assigneeFilter} {
		if v := q.Get(key); v != "" {
			id, err := uuid.Parse(v)
			if err != nil {
				httpx.Error(w, apperr.New("VALIDATION", "Invalid "+key+".", http.StatusBadRequest))
				return
			}
			*dst = &id
		}
	}
	rows, err := s.q.ListReportTasks(r.Context(), params)
	if err != nil {
		httpx.Error(w, err)
		return
	}

	httpx.JSON(w, http.StatusOK, buildReport(rows, from, end, today, assigneeFilter), nil)
}

func buildReport(rows []db.ListReportTasksRow, from, end, today time.Time, assignee *uuid.UUID) ReportDTO {
	in := func(t time.Time) bool { return !t.Before(from) && t.Before(end) }

	totals := &tally{}
	people := map[uuid.UUID]*tally{}
	var unassigned *tally
	projects := map[uuid.UUID]*tally{}
	projectKeys := map[uuid.UUID]string{}

	weeks := []ReportWeek{}
	weekIndex := map[string]int{}
	for d := weekStart(from); d.Before(end); d = d.AddDate(0, 0, 7) {
		weekIndex[d.Format(dateLayout)] = len(weeks)
		weeks = append(weeks, ReportWeek{WeekStart: d.Format(dateLayout)})
	}

	out := ReportDTO{
		From:      from.Format(dateLayout),
		To:        end.AddDate(0, 0, -1).Format(dateLayout),
		ByPerson:  []ReportGroup{},
		ByProject: []ReportProject{},
		Completed: []ReportTask{},
		Open:      []ReportTask{},
	}

	for _, row := range rows {
		if assignee != nil && (row.AssigneeID == nil || *row.AssigneeID != *assignee) {
			continue
		}
		task := reportTask(row)
		created := in(row.CreatedAt.Time)
		completed := completedStatus(row.Status) && task.CompletedAt != nil && in(*task.CompletedAt)
		open := !completedStatus(row.Status)
		if !created && !completed && !open {
			continue
		}

		groups := []*tally{totals}
		if row.AssigneeID != nil {
			if people[*row.AssigneeID] == nil {
				people[*row.AssigneeID] = &tally{}
			}
			groups = append(groups, people[*row.AssigneeID])
		} else {
			if unassigned == nil {
				unassigned = &tally{}
			}
			groups = append(groups, unassigned)
		}
		if projects[row.ProjectID] == nil {
			projects[row.ProjectID] = &tally{}
			projectKeys[row.ProjectID] = row.ProjectKey
		}
		groups = append(groups, projects[row.ProjectID])

		overdue := open && row.DueDate.Valid && row.DueDate.Time.Before(today)
		for _, g := range groups {
			if created {
				g.Created++
			}
			if completed {
				g.Completed++
				if row.Source == "ai" {
					g.CompletedByAI++
				}
				if task.CycleHours != nil {
					g.cycles = append(g.cycles, *task.CycleHours)
				}
			}
			if open {
				g.Open++
				switch row.Status {
				case StatusInProgress:
					g.InProgress++
				case StatusReview:
					g.Review++
				}
				if row.Blocked {
					g.Blocked++
				}
				if overdue {
					g.Overdue++
				}
			}
		}

		if created {
			if i, ok := weekIndex[weekStart(row.CreatedAt.Time).Format(dateLayout)]; ok {
				weeks[i].Created++
			}
		}
		if completed {
			if i, ok := weekIndex[weekStart(*task.CompletedAt).Format(dateLayout)]; ok {
				weeks[i].Completed++
			}
			out.Completed = append(out.Completed, task)
		}
		if open {
			out.Open = append(out.Open, task)
		}
	}

	out.Totals = totals.finish()
	for id, t := range people {
		id := id
		out.ByPerson = append(out.ByPerson, ReportGroup{ID: &id, ReportCounts: t.finish()})
	}
	sort.Slice(out.ByPerson, func(i, j int) bool {
		a, b := out.ByPerson[i], out.ByPerson[j]
		if a.Completed != b.Completed {
			return a.Completed > b.Completed
		}
		return a.Open > b.Open
	})
	if unassigned != nil {
		out.ByPerson = append(out.ByPerson, ReportGroup{ReportCounts: unassigned.finish()})
	}
	for id, t := range projects {
		out.ByProject = append(out.ByProject, ReportProject{ID: id, Key: projectKeys[id], ReportCounts: t.finish()})
	}
	sort.Slice(out.ByProject, func(i, j int) bool { return out.ByProject[i].Key < out.ByProject[j].Key })
	sort.Slice(out.Completed, func(i, j int) bool { return out.Completed[i].CompletedAt.After(*out.Completed[j].CompletedAt) })
	out.Weekly = weeks
	return out
}

func reportTask(row db.ListReportTasksRow) ReportTask {
	t := ReportTask{
		ID:                row.ID,
		Key:               row.ProjectKey + "-" + itoa(row.Number),
		Title:             row.Title,
		ProjectID:         row.ProjectID,
		Status:            row.Status,
		Priority:          row.Priority,
		Source:            row.Source,
		Blocked:           row.Blocked,
		AssigneeID:        row.AssigneeID,
		CreatedAt:         row.CreatedAt.Time,
		CompletionSummary: row.CompletionSummary,
	}
	if row.StartedAt.Valid {
		v := row.StartedAt.Time
		t.StartedAt = &v
	}
	if row.CompletedAt.Valid {
		v := row.CompletedAt.Time
		t.CompletedAt = &v
	}
	if row.DueDate.Valid {
		v := row.DueDate.Time.Format(dateLayout)
		t.DueDate = &v
	}
	if completedStatus(row.Status) && t.CompletedAt != nil {
		start := t.CreatedAt
		if t.StartedAt != nil && t.StartedAt.Before(*t.CompletedAt) {
			start = *t.StartedAt
		}
		h := round1(t.CompletedAt.Sub(start).Hours())
		t.CycleHours = &h
	}
	return t
}

// weekStart returns the Monday (UTC) of t's week.
func weekStart(t time.Time) time.Time {
	d := t.UTC().Truncate(24 * time.Hour)
	offset := (int(d.Weekday()) + 6) % 7
	return d.AddDate(0, 0, -offset)
}
