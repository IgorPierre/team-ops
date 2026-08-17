package config

import (
	"fmt"
	"os"
	"strconv"
	"strings"
	"time"
)

type Config struct {
	HTTPAddr         string
	DatabaseURL      string
	AppURL           string
	LogLevel         string
	CookieSecure     bool
	CookieName       string
	MigrationsDir    string
	ShutdownWait     time.Duration
	SessionTTL       time.Duration
	RegistrationOpen bool
}

func Load() (Config, error) {
	cfg := Config{
		HTTPAddr:         env("HTTP_ADDR", ":8080"),
		DatabaseURL:      os.Getenv("DATABASE_URL"),
		AppURL:           env("APP_URL", "http://localhost:3000"),
		LogLevel:         env("LOG_LEVEL", "info"),
		CookieSecure:     envBool("COOKIE_SECURE", false),
		CookieName:       env("COOKIE_NAME", "teamops_session"),
		MigrationsDir:    env("MIGRATIONS_DIR", "../../db/migrations"),
		ShutdownWait:     15 * time.Second,
		SessionTTL:       30 * 24 * time.Hour,
		RegistrationOpen: envBool("REGISTRATION_OPEN", false),
	}
	if cfg.DatabaseURL == "" {
		return Config{}, fmt.Errorf("DATABASE_URL is required")
	}
	return cfg, nil
}

func env(key, fallback string) string {
	if v := strings.TrimSpace(os.Getenv(key)); v != "" {
		return v
	}
	return fallback
}

func envBool(key string, fallback bool) bool {
	v := strings.TrimSpace(os.Getenv(key))
	if v == "" {
		return fallback
	}
	b, err := strconv.ParseBool(v)
	if err != nil {
		return fallback
	}
	return b
}
