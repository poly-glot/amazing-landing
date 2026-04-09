package auth

import (
	"context"
	"testing"
)

func TestLoginAttemptTracker_NotBlockedInitially(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	tracker := NewLoginAttemptTracker(ctx)

	if tracker.IsBlocked("user@example.com") {
		t.Error("expected new email to not be blocked")
	}
}

func TestLoginAttemptTracker_BlocksAfterMaxAttempts(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	tracker := NewLoginAttemptTracker(ctx)

	email := "brute@example.com"
	for i := 0; i < maxAttempts; i++ {
		tracker.RecordFailure(email)
	}

	if !tracker.IsBlocked(email) {
		t.Errorf("expected email to be blocked after %d failures", maxAttempts)
	}
}

func TestLoginAttemptTracker_NotBlockedBelowMaxAttempts(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	tracker := NewLoginAttemptTracker(ctx)

	email := "user@example.com"
	for i := 0; i < maxAttempts-1; i++ {
		tracker.RecordFailure(email)
	}

	if tracker.IsBlocked(email) {
		t.Error("expected email to not be blocked below max attempts")
	}
}

func TestLoginAttemptTracker_SuccessClearsAttempts(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	tracker := NewLoginAttemptTracker(ctx)

	email := "user@example.com"
	for i := 0; i < maxAttempts-1; i++ {
		tracker.RecordFailure(email)
	}
	tracker.RecordSuccess(email)

	// After success, a new failure cycle starts fresh
	tracker.RecordFailure(email)
	if tracker.IsBlocked(email) {
		t.Error("expected email to not be blocked after success reset")
	}
}

func TestLoginAttemptTracker_DifferentEmailsIndependent(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	tracker := NewLoginAttemptTracker(ctx)

	for i := 0; i < maxAttempts; i++ {
		tracker.RecordFailure("blocked@example.com")
	}

	if tracker.IsBlocked("other@example.com") {
		t.Error("expected different email to not be affected")
	}
}
