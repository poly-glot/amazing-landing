package auth

import (
	"context"
	"sync"
	"time"
)

const (
	maxAttempts  = 5
	lockDuration = 15 * time.Minute
)

type loginAttempt struct {
	count     int
	lockUntil time.Time
	createdAt time.Time
}

type LoginAttemptTracker struct {
	mu       sync.Mutex
	attempts map[string]*loginAttempt
}

func NewLoginAttemptTracker(ctx context.Context) *LoginAttemptTracker {
	t := &LoginAttemptTracker{attempts: make(map[string]*loginAttempt)}
	go t.cleanupLoop(ctx)
	return t
}

func (t *LoginAttemptTracker) IsBlocked(email string) bool {
	t.mu.Lock()
	defer t.mu.Unlock()
	a, ok := t.attempts[email]
	if !ok {
		return false
	}
	return a.count >= maxAttempts && time.Now().Before(a.lockUntil)
}

func (t *LoginAttemptTracker) RecordFailure(email string) {
	t.mu.Lock()
	defer t.mu.Unlock()
	a, ok := t.attempts[email]
	if !ok {
		a = &loginAttempt{createdAt: time.Now()}
		t.attempts[email] = a
	}
	a.count++
	if a.count >= maxAttempts {
		a.lockUntil = time.Now().Add(lockDuration)
	}
}

func (t *LoginAttemptTracker) RecordSuccess(email string) {
	t.mu.Lock()
	defer t.mu.Unlock()
	delete(t.attempts, email)
}

func (t *LoginAttemptTracker) cleanupLoop(ctx context.Context) {
	ticker := time.NewTicker(5 * time.Minute)
	defer ticker.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			t.mu.Lock()
			now := time.Now()
			for key, a := range t.attempts {
				if a.count >= maxAttempts {
					if now.After(a.lockUntil) {
						delete(t.attempts, key)
					}
				} else if now.Sub(a.createdAt) > lockDuration {
					delete(t.attempts, key)
				}
			}
			t.mu.Unlock()
		}
	}
}
