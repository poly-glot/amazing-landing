package auth

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestRateLimiter_AllowsNormalTraffic(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	rl := NewRateLimiter(ctx)

	handler := rl.Middleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))

	r := httptest.NewRequest("GET", "/admin", nil)
	r.RemoteAddr = "1.2.3.4:12345"
	w := httptest.NewRecorder()
	handler.ServeHTTP(w, r)

	if w.Code != http.StatusOK {
		t.Errorf("status = %d, want %d", w.Code, http.StatusOK)
	}
}

func TestRateLimiter_BlocksExcessiveLoginAttempts(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	rl := NewRateLimiter(ctx)

	handler := rl.Middleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))

	// Send loginMax+1 POST /login from same IP
	for i := 0; i <= loginMax; i++ {
		r := httptest.NewRequest("POST", "/login", nil)
		r.RemoteAddr = "10.0.0.1:12345"
		w := httptest.NewRecorder()
		handler.ServeHTTP(w, r)

		if i < loginMax && w.Code != http.StatusOK {
			t.Errorf("request %d: status = %d, want %d", i, w.Code, http.StatusOK)
		}
		if i == loginMax && w.Code != http.StatusTooManyRequests {
			t.Errorf("request %d: status = %d, want %d", i, w.Code, http.StatusTooManyRequests)
		}
	}
}

func TestRateLimiter_BlocksExcessiveGeneralRequests(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	rl := NewRateLimiter(ctx)

	handler := rl.Middleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))

	// Send generalMax+1 requests
	for i := 0; i <= generalMax; i++ {
		r := httptest.NewRequest("GET", "/admin", nil)
		r.RemoteAddr = "10.0.0.2:12345"
		w := httptest.NewRecorder()
		handler.ServeHTTP(w, r)

		if i == generalMax && w.Code != http.StatusTooManyRequests {
			t.Errorf("request %d: status = %d, want %d", i, w.Code, http.StatusTooManyRequests)
		}
	}
}

func TestRateLimiter_DifferentIPsIndependent(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	rl := NewRateLimiter(ctx)

	handler := rl.Middleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))

	// Exhaust rate limit for IP 1
	for i := 0; i <= generalMax; i++ {
		r := httptest.NewRequest("GET", "/admin", nil)
		r.RemoteAddr = "10.0.0.3:12345"
		w := httptest.NewRecorder()
		handler.ServeHTTP(w, r)
	}

	// IP 2 should still be fine
	r := httptest.NewRequest("GET", "/admin", nil)
	r.RemoteAddr = "10.0.0.4:12345"
	w := httptest.NewRecorder()
	handler.ServeHTTP(w, r)

	if w.Code != http.StatusOK {
		t.Errorf("different IP status = %d, want %d", w.Code, http.StatusOK)
	}
}

func TestExtractClientIP_XForwardedFor(t *testing.T) {
	r := httptest.NewRequest("GET", "/", nil)
	r.Header.Set("X-Forwarded-For", "203.0.113.1, 70.41.3.18")
	r.RemoteAddr = "10.0.0.1:1234"

	ip := extractClientIP(r)
	if ip != "203.0.113.1" {
		t.Errorf("extractClientIP = %q, want %q", ip, "203.0.113.1")
	}
}

func TestExtractClientIP_NoHeader(t *testing.T) {
	r := httptest.NewRequest("GET", "/", nil)
	r.RemoteAddr = "10.0.0.1:1234"

	ip := extractClientIP(r)
	if ip != "10.0.0.1:1234" {
		t.Errorf("extractClientIP = %q, want %q", ip, "10.0.0.1:1234")
	}
}
