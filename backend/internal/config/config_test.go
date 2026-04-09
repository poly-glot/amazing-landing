package config

import (
	"os"
	"testing"
)

func TestLoad_Defaults(t *testing.T) {
	// Clear any env vars that might be set
	for _, key := range []string{"PORT", "ENVIRONMENT", "GCP_PROJECT_ID", "ENCRYPTION_KEY", "VITE_DEV_URL", "SEED_DATA"} {
		os.Unsetenv(key)
	}

	cfg := Load()

	if cfg.Port != 8080 {
		t.Errorf("Port = %d, want 8080", cfg.Port)
	}
	if cfg.Environment != "dev" {
		t.Errorf("Environment = %q, want %q", cfg.Environment, "dev")
	}
	if cfg.GCPProjectID != "demo-azadi" {
		t.Errorf("GCPProjectID = %q, want %q", cfg.GCPProjectID, "demo-azadi")
	}
	if !cfg.IsDev() {
		t.Error("IsDev() should return true for 'dev' environment")
	}
}

func TestLoad_FromEnv(t *testing.T) {
	t.Setenv("PORT", "9090")
	t.Setenv("ENVIRONMENT", "production")
	t.Setenv("GCP_PROJECT_ID", "my-project")
	t.Setenv("SEED_DATA", "false")

	cfg := Load()

	if cfg.Port != 9090 {
		t.Errorf("Port = %d, want 9090", cfg.Port)
	}
	if cfg.Environment != "production" {
		t.Errorf("Environment = %q, want %q", cfg.Environment, "production")
	}
	if cfg.GCPProjectID != "my-project" {
		t.Errorf("GCPProjectID = %q, want %q", cfg.GCPProjectID, "my-project")
	}
	if cfg.IsDev() {
		t.Error("IsDev() should return false for 'production' environment")
	}
	if cfg.SeedData {
		t.Error("SeedData should be false")
	}
}

func TestLoad_InvalidPort(t *testing.T) {
	t.Setenv("PORT", "not-a-number")
	cfg := Load()
	if cfg.Port != 8080 {
		t.Errorf("Port = %d, want 8080 for invalid PORT env", cfg.Port)
	}
}

func TestEnvHelpers(t *testing.T) {
	tests := []struct {
		name     string
		fn       func() string
		envKey   string
		envVal   string
		expected string
	}{
		{"envStr_set", func() string { return envStr("TEST_STR", "default") }, "TEST_STR", "override", "override"},
		{"envStr_empty", func() string { return envStr("TEST_STR_EMPTY", "default") }, "", "", "default"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if tt.envKey != "" {
				t.Setenv(tt.envKey, tt.envVal)
			}
			if got := tt.fn(); got != tt.expected {
				t.Errorf("got %q, want %q", got, tt.expected)
			}
		})
	}
}
