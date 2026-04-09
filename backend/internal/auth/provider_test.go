package auth

import (
	"context"
	"errors"
	"testing"
	"time"

	"amazing-landing/internal/model"

	"golang.org/x/crypto/bcrypt"
)

// mockAdminRepo is a test double for the adminFinder interface.
type mockAdminRepo struct {
	findByEmailFn func(ctx context.Context, email string) (*model.AdminUser, error)
	saveFn        func(ctx context.Context, user *model.AdminUser) (*model.AdminUser, error)
}

func (m *mockAdminRepo) FindByEmail(ctx context.Context, email string) (*model.AdminUser, error) {
	if m.findByEmailFn != nil {
		return m.findByEmailFn(ctx, email)
	}
	return nil, nil
}

func (m *mockAdminRepo) Save(ctx context.Context, user *model.AdminUser) (*model.AdminUser, error) {
	if m.saveFn != nil {
		return m.saveFn(ctx, user)
	}
	return user, nil
}

func hashPassword(t *testing.T, password string) string {
	t.Helper()
	h, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.MinCost)
	if err != nil {
		t.Fatalf("bcrypt hash failed: %v", err)
	}
	return string(h)
}

func TestProvider_Authenticate_Success(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	hash := hashPassword(t, "correct-password")
	user := &model.AdminUser{
		Email:              "admin@test.com",
		PasswordHash:       hash,
		Name:               "Admin",
		MustChangePassword: false,
	}
	user.SetID(42)

	repo := &mockAdminRepo{
		findByEmailFn: func(_ context.Context, email string) (*model.AdminUser, error) {
			if email == "admin@test.com" {
				return user, nil
			}
			return nil, nil
		},
	}

	tracker := NewLoginAttemptTracker(ctx)
	provider := NewProvider(repo, tracker)

	session, mustChange, err := provider.Authenticate(ctx, "admin@test.com", "correct-password")
	if err != nil {
		t.Fatalf("Authenticate returned error: %v", err)
	}
	if mustChange {
		t.Error("expected mustChange to be false")
	}
	if session == nil {
		t.Fatal("expected non-nil session")
	}
	if session.AdminID != 42 {
		t.Errorf("AdminID = %d, want 42", session.AdminID)
	}
	if session.AdminName != "Admin" {
		t.Errorf("AdminName = %q, want %q", session.AdminName, "Admin")
	}
	if session.Email != "admin@test.com" {
		t.Errorf("Email = %q, want %q", session.Email, "admin@test.com")
	}
}

func TestProvider_Authenticate_MustChangePassword(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	hash := hashPassword(t, "changeme")
	user := &model.AdminUser{
		Email:              "admin@test.com",
		PasswordHash:       hash,
		Name:               "Admin",
		MustChangePassword: true,
	}
	user.SetID(1)

	repo := &mockAdminRepo{
		findByEmailFn: func(_ context.Context, _ string) (*model.AdminUser, error) {
			return user, nil
		},
	}

	tracker := NewLoginAttemptTracker(ctx)
	provider := NewProvider(repo, tracker)

	_, mustChange, err := provider.Authenticate(ctx, "admin@test.com", "changeme")
	if err != nil {
		t.Fatalf("Authenticate returned error: %v", err)
	}
	if !mustChange {
		t.Error("expected mustChange to be true")
	}
}

func TestProvider_Authenticate_WrongPassword(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	hash := hashPassword(t, "correct-password")
	user := &model.AdminUser{
		Email:        "admin@test.com",
		PasswordHash: hash,
		Name:         "Admin",
	}
	user.SetID(1)

	repo := &mockAdminRepo{
		findByEmailFn: func(_ context.Context, _ string) (*model.AdminUser, error) {
			return user, nil
		},
	}

	tracker := NewLoginAttemptTracker(ctx)
	provider := NewProvider(repo, tracker)

	session, _, err := provider.Authenticate(ctx, "admin@test.com", "wrong-password")
	if !errors.Is(err, ErrBadCredentials) {
		t.Errorf("expected ErrBadCredentials, got %v", err)
	}
	if session != nil {
		t.Error("expected nil session for wrong password")
	}
}

func TestProvider_Authenticate_UserNotFound(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	repo := &mockAdminRepo{
		findByEmailFn: func(_ context.Context, _ string) (*model.AdminUser, error) {
			return nil, nil
		},
	}

	tracker := NewLoginAttemptTracker(ctx)
	provider := NewProvider(repo, tracker)

	session, _, err := provider.Authenticate(ctx, "nobody@test.com", "password")
	if !errors.Is(err, ErrBadCredentials) {
		t.Errorf("expected ErrBadCredentials, got %v", err)
	}
	if session != nil {
		t.Error("expected nil session for non-existent user")
	}
}

func TestProvider_Authenticate_RepoError(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	repo := &mockAdminRepo{
		findByEmailFn: func(_ context.Context, _ string) (*model.AdminUser, error) {
			return nil, errors.New("database connection failed")
		},
	}

	tracker := NewLoginAttemptTracker(ctx)
	provider := NewProvider(repo, tracker)

	session, _, err := provider.Authenticate(ctx, "admin@test.com", "password")
	if err == nil {
		t.Error("expected error from repo failure")
	}
	if session != nil {
		t.Error("expected nil session on repo error")
	}
}

func TestProvider_Authenticate_LockedAccount(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	hash := hashPassword(t, "correct-password")
	user := &model.AdminUser{
		Email:        "admin@test.com",
		PasswordHash: hash,
		Name:         "Admin",
	}
	user.SetID(1)

	repo := &mockAdminRepo{
		findByEmailFn: func(_ context.Context, _ string) (*model.AdminUser, error) {
			return user, nil
		},
	}

	tracker := NewLoginAttemptTracker(ctx)
	provider := NewProvider(repo, tracker)

	// Exhaust attempts with wrong password
	for i := 0; i < maxAttempts; i++ {
		_, _, _ = provider.Authenticate(ctx, "admin@test.com", "wrong-password")
	}

	// Now even the correct password should fail due to lock
	session, _, err := provider.Authenticate(ctx, "admin@test.com", "correct-password")
	if !errors.Is(err, ErrAccountLocked) {
		t.Errorf("expected ErrAccountLocked, got %v", err)
	}
	if session != nil {
		t.Error("expected nil session for locked account")
	}
}

func TestProvider_Authenticate_UpdatesLastLoginAt(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	hash := hashPassword(t, "password")
	user := &model.AdminUser{
		Email:        "admin@test.com",
		PasswordHash: hash,
		Name:         "Admin",
	}
	user.SetID(1)

	var savedUser *model.AdminUser
	repo := &mockAdminRepo{
		findByEmailFn: func(_ context.Context, _ string) (*model.AdminUser, error) {
			return user, nil
		},
		saveFn: func(_ context.Context, u *model.AdminUser) (*model.AdminUser, error) {
			savedUser = u
			return u, nil
		},
	}

	tracker := NewLoginAttemptTracker(ctx)
	provider := NewProvider(repo, tracker)

	before := time.Now()
	_, _, _ = provider.Authenticate(ctx, "admin@test.com", "password")

	if savedUser == nil {
		t.Fatal("expected Save to be called with updated user")
	}
	if savedUser.LastLoginAt == nil {
		t.Fatal("expected LastLoginAt to be set")
	}
	if savedUser.LastLoginAt.Before(before) {
		t.Error("expected LastLoginAt to be at or after test start")
	}
}
