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
	loadDotEnv()
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

func loadDotEnv() {
	for _, path := range []string{".env", "../.env", "../../.env"} {
		data, err := os.ReadFile(path)
		if err != nil {
			continue
		}
		for _, line := range strings.Split(string(data), "\n") {
			line = strings.TrimSpace(line)
			if line == "" || strings.HasPrefix(line, "#") {
				continue
			}
			line = strings.TrimPrefix(line, "export ")
			key, val, ok := strings.Cut(line, "=")
			if !ok {
				continue
			}
			key = strings.TrimSpace(key)
			if key == "" {
				continue
			}
			if os.Getenv(key) != "" {
				continue
			}
			val = strings.TrimSpace(val)
			if len(val) >= 2 {
				if q := val[0]; (q == '"' || q == '\'') && val[len(val)-1] == q {
					val = val[1 : len(val)-1]
				}
			}
			_ = os.Setenv(key, val)
		}
		return
	}
}
