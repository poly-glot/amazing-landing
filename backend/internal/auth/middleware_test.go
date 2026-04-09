package auth

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestRequireAdmin_RedirectsWhenNoSession(t *testing.T) {
	ss := newTestSessionStore(t)

	handler := RequireAdmin(ss, func(w http.ResponseWriter, r *http.Request) {
		t.Error("handler should not be called without session")
	})

	r := httptest.NewRequest("GET", "/admin", nil)
	w := httptest.NewRecorder()
	handler.ServeHTTP(w, r)

	resp := w.Result()
	if resp.StatusCode != http.StatusFound {
		t.Errorf("status = %d, want %d", resp.StatusCode, http.StatusFound)
	}
	loc := resp.Header.Get("Location")
	if loc != "/login" {
		t.Errorf("Location = %q, want %q", loc, "/login")
	}
}

func TestRequireAdmin_CallsHandlerWithSession(t *testing.T) {
	ss := newTestSessionStore(t)

	// Create a session
	data := &SessionData{AdminID: 1, AdminName: "Admin", Email: "a@b.com"}
	w := httptest.NewRecorder()
	if err := ss.Create(w, data); err != nil {
		t.Fatalf("Create failed: %v", err)
	}
	var sessionCookie *http.Cookie
	for _, c := range w.Result().Cookies() {
		if c.Name == "__session" {
			sessionCookie = c
		}
	}

	var handlerCalled bool
	handler := RequireAdmin(ss, func(w http.ResponseWriter, r *http.Request) {
		handlerCalled = true
		admin := AdminFromContext(r.Context())
		if admin == nil {
			t.Error("expected admin in context")
		}
		if admin.AdminID != 1 {
			t.Errorf("AdminID = %d, want 1", admin.AdminID)
		}
		sid := SessionIDFromContext(r.Context())
		if sid == "" {
			t.Error("expected session ID in context")
		}
	})

	r := httptest.NewRequest("GET", "/admin", nil)
	r.AddCookie(sessionCookie)
	rw := httptest.NewRecorder()
	handler.ServeHTTP(rw, r)

	if !handlerCalled {
		t.Error("expected handler to be called")
	}
}

func TestOptionalAdmin_CallsHandlerWithoutSession(t *testing.T) {
	ss := newTestSessionStore(t)

	var handlerCalled bool
	handler := OptionalAdmin(ss, func(w http.ResponseWriter, r *http.Request) {
		handlerCalled = true
		admin := AdminFromContext(r.Context())
		if admin != nil {
			t.Error("expected nil admin without session")
		}
	})

	r := httptest.NewRequest("GET", "/", nil)
	w := httptest.NewRecorder()
	handler.ServeHTTP(w, r)

	if !handlerCalled {
		t.Error("expected handler to be called")
	}
}

func TestAdminFromContext_NilWhenNotSet(t *testing.T) {
	ctx := context.Background()
	admin := AdminFromContext(ctx)
	if admin != nil {
		t.Error("expected nil admin from empty context")
	}
}

func TestSessionIDFromContext_EmptyWhenNotSet(t *testing.T) {
	ctx := context.Background()
	sid := SessionIDFromContext(ctx)
	if sid != "" {
		t.Errorf("expected empty session ID from empty context, got %q", sid)
	}
}

func TestContextWithSession_RoundTrip(t *testing.T) {
	data := &SessionData{AdminID: 99, AdminName: "Test", Email: "test@test.com"}
	ctx := ContextWithSession(context.Background(), data, "session-xyz")

	got := AdminFromContext(ctx)
	if got == nil {
		t.Fatal("expected admin from context")
	}
	if got.AdminID != 99 {
		t.Errorf("AdminID = %d, want 99", got.AdminID)
	}
	if sid := SessionIDFromContext(ctx); sid != "session-xyz" {
		t.Errorf("SessionID = %q, want %q", sid, "session-xyz")
	}
}
