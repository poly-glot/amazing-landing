package main

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"amazing-landing/internal/admin"
	"amazing-landing/internal/auth"
	"amazing-landing/internal/config"
	"amazing-landing/internal/email"
	"amazing-landing/internal/seed"
	"amazing-landing/internal/server"
	"amazing-landing/internal/survey"

	"cloud.google.com/go/datastore"
)

func main() {
	cfg := config.Load()

	var handler slog.Handler
	if cfg.IsDev() {
		handler = slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelDebug})
	} else {
		handler = slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelInfo})
	}
	slog.SetDefault(slog.New(handler))

	ctx := context.Background()

	var (
		dsClient *datastore.Client
		err      error
	)
	if cfg.DatastoreDB != "" {
		dsClient, err = datastore.NewClientWithDatabase(ctx, cfg.GCPProjectID, cfg.DatastoreDB)
	} else {
		dsClient, err = datastore.NewClient(ctx, cfg.GCPProjectID)
	}
	if err != nil {
		slog.Error("failed to create datastore client", "error", err)
		os.Exit(1)
	}
	defer func() { _ = dsClient.Close() }()

	// Repositories
	promotionRepo := survey.NewPromotionRepository(dsClient)
	storeRepo := survey.NewStoreRepository(dsClient)
	submissionRepo := survey.NewSubmissionRepository(dsClient)
	productRepo := survey.NewProductRepository(dsClient)
	questionRepo := survey.NewQuestionConfigRepository(dsClient)
	emailRepo := email.NewRepository(dsClient)
	adminUserRepo := auth.NewAdminUserRepository(dsClient)

	// Auth
	loginTracker := auth.NewLoginAttemptTracker(ctx)
	rateLimiter := auth.NewRateLimiter(ctx)
	sessions, err := auth.NewSessionStore(ctx, cfg.EncryptionKey, !cfg.IsDev())
	if err != nil {
		slog.Error("failed to create session store", "error", err)
		os.Exit(1)
	}
	flashes := auth.NewFlashStore()
	authProvider := auth.NewProvider(adminUserRepo, loginTracker)

	// Services
	emailService := email.NewService(emailRepo, submissionRepo, storeRepo, promotionRepo)

	// Server
	srv, err := server.New(server.Deps{
		Cfg:         cfg,
		Sessions:    sessions,
		Flashes:     flashes,
		RateLimiter: rateLimiter,
	})
	if err != nil {
		slog.Error("failed to create server", "error", err)
		os.Exit(1)
	}

	renderFn := srv.RenderFunc()

	// Handlers
	authHandler := auth.NewHandler(authProvider, sessions, flashes, adminUserRepo, renderFn, cfg.DemoMode)
	surveyHandler := survey.NewHandler(promotionRepo, storeRepo, submissionRepo, productRepo, questionRepo, emailService)
	adminHandler := admin.NewHandler(promotionRepo, storeRepo, submissionRepo, productRepo, questionRepo, adminUserRepo, flashes, renderFn)
	emailHandler := email.NewHandler(emailService)

	srv.SetHandlers(authHandler, surveyHandler, adminHandler, emailHandler)

	// Seed data
	if cfg.SeedData {
		seeder := seed.NewSeeder(dsClient, cfg.DemoMode)
		if err := seeder.Seed(ctx); err != nil {
			slog.Error("failed to seed data", "error", err)
		}
	}

	// Start HTTP server
	httpServer := &http.Server{
		Addr:              fmt.Sprintf(":%d", cfg.Port),
		Handler:           srv.Handler(),
		ReadHeaderTimeout: 10 * time.Second,
		ReadTimeout:       30 * time.Second,
		WriteTimeout:      60 * time.Second,
		IdleTimeout:       120 * time.Second,
	}

	ctx, stop := signal.NotifyContext(ctx, syscall.SIGTERM, syscall.SIGINT)
	defer stop()

	go func() {
		slog.Info("server starting", "port", cfg.Port, "env", cfg.Environment)
		if err := httpServer.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			slog.Error("server error", "error", err)
			stop()
		}
	}()

	<-ctx.Done()
	slog.Info("shutting down...")

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := httpServer.Shutdown(shutdownCtx); err != nil {
		slog.Error("shutdown error", "error", err)
	}
}
