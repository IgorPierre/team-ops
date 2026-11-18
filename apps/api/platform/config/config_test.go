package config

import "testing"

func TestDeploymentConfig(t *testing.T) {
	t.Setenv("DATABASE_URL", "postgres://localhost/teamops")
	t.Setenv("PORT", "3210")
	t.Setenv("HTTP_ADDR", "")
	t.Setenv("MIGRATE_ON_START", "false")
	cfg, err := Load()
	if err != nil {
		t.Fatal(err)
	}
	if cfg.HTTPAddr != ":3210" || cfg.MigrateOnStart {
		t.Fatalf("serverless config: %#v", cfg)
	}
	t.Setenv("HTTP_ADDR", ":9090")
	t.Setenv("MIGRATE_ON_START", "")
	cfg, err = Load()
	if err != nil {
		t.Fatal(err)
	}
	if cfg.HTTPAddr != ":9090" || !cfg.MigrateOnStart {
		t.Fatalf("container config: %#v", cfg)
	}
}
