package main

import (
	"context"
	"database/sql"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	_ "github.com/jackc/pgx/v5/stdlib"
	"github.com/pressly/goose/v3"

	"github.com/team-ops/api/internal/agents"
	"github.com/team-ops/api/internal/apperr"
	"github.com/team-ops/api/internal/auth"
	"github.com/team-ops/api/internal/organizations"
	"github.com/team-ops/api/internal/projects"
	"github.com/team-ops/api/internal/tasks"
	"github.com/team-ops/api/platform/config"
	"github.com/team-ops/api/platform/database"
	httpx "github.com/team-ops/api/platform/http"
	"github.com/team-ops/api/platform/logging"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		slog.Error("config", slog.String("err", err.Error()))
		os.Exit(1)
	}
	log := logging.New(cfg.LogLevel)

	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	pool, err := database.Connect(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Error("database", slog.String("err", err.Error()))
		os.Exit(1)
	}
	defer pool.Close()

	if err := runMigrations(cfg.DatabaseURL, cfg.MigrationsDir); err != nil {
		log.Error("migrate", slog.String("err", err.Error()))
		os.Exit(1)
	}

	authSvc := auth.NewService(pool, cfg.CookieName, cfg.CookieSecure, cfg.SessionTTL, log)
	orgSvc := organizations.New(pool)
	projectSvc := projects.New(pool, orgSvc)
	taskSvc := tasks.New(pool, orgSvc)
	agentSvc := agents.New(pool, orgSvc)

	r := chi.NewRouter()
	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(middleware.Recoverer)
	r.Use(middleware.Timeout(30 * time.Second))
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{cfg.AppURL, "http://localhost:3000", "http://127.0.0.1:3000"},
		AllowedMethods:   []string{"GET", "POST", "PATCH", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type"},
		AllowCredentials: true,
	}))
	r.Use(authSvc.Middleware)

	r.Get("/healthz", func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("ok"))
	})

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

	r.NotFound(func(w http.ResponseWriter, _ *http.Request) {
		httpx.Error(w, apperr.New("NOT_FOUND", "Not found.", http.StatusNotFound))
	})

	srv := &http.Server{
		Addr:              cfg.HTTPAddr,
		Handler:           r,
		ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout:       15 * time.Second,
		WriteTimeout:      30 * time.Second,
		IdleTimeout:       60 * time.Second,
	}

	go func() {
		log.Info("listening", slog.String("addr", cfg.HTTPAddr))
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Error("http", slog.String("err", err.Error()))
			stop()
		}
	}()

	<-ctx.Done()
	shutdownCtx, cancel := context.WithTimeout(context.Background(), cfg.ShutdownWait)
	defer cancel()
	if err := srv.Shutdown(shutdownCtx); err != nil {
		log.Error("shutdown", slog.String("err", err.Error()))
	}
}

func runMigrations(databaseURL, dir string) error {
	sqlDB, err := sql.Open("pgx", databaseURL)
	if err != nil {
		return err
	}
	defer sqlDB.Close()
	if err := goose.SetDialect("postgres"); err != nil {
		return err
	}
	return goose.Up(sqlDB, dir)
}
