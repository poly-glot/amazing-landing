package config

import (
	"os"
	"strconv"
)

type Config struct {
	Port           int
	Environment    string
	GCPProjectID   string
	DatastoreDB    string
	EncryptionKey  string
	ViteDevURL     string
	SeedData       bool
	DemoMode       bool
	AdminEmail     string
	AdminPassHash  string
	FrontendDir    string
	AdminAssetsDir string
}

func Load() *Config {
	return &Config{
		Port:           envInt("PORT", 8080),
		Environment:    envStr("ENVIRONMENT", "dev"),
		GCPProjectID:   envStr("GCP_PROJECT_ID", "demo-azadi"),
		DatastoreDB:    envStr("DATASTORE_DB", ""),
		EncryptionKey:  envStr("ENCRYPTION_KEY", "dev-only-key-change-in-prod-32ch"),
		ViteDevURL:     envStr("VITE_DEV_URL", ""),
		SeedData:       envBool("SEED_DATA", true),
		DemoMode:       envBool("DEMO_MODE", true),
		AdminEmail:     envStr("ADMIN_EMAIL", "admin@azadi.com"),
		AdminPassHash:  envStr("ADMIN_PASSWORD_HASH", ""),
		FrontendDir:    envStr("FRONTEND_DIR", "../frontend"),
		AdminAssetsDir: envStr("ADMIN_ASSETS_DIR", "../frontend/admin/dist"),
	}
}

func (c *Config) IsDev() bool {
	return c.Environment == "dev"
}

func envStr(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func envInt(key string, fallback int) int {
	if v := os.Getenv(key); v != "" {
		if n, err := strconv.Atoi(v); err == nil {
			return n
		}
	}
	return fallback
}

func envBool(key string, fallback bool) bool {
	if v := os.Getenv(key); v != "" {
		if b, err := strconv.ParseBool(v); err == nil {
			return b
		}
	}
	return fallback
}
