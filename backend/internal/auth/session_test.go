package auth

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"
)

const testEncryptionKey = "test-encryption-key-32-chars-ok!"

func newTestSessionStore(t *testing.T) *SessionStore {
	t.Helper()
	ctx, cancel := context.WithCancel(context.Background())
	t.Cleanup(cancel)

	ss, err := NewSessionStore(ctx, testEncryptionKey, false)
	if err != nil {
		t.Fatalf("failed to create session store: %v", err)
	}
	return ss
}

func TestNewSessionStore_RejectsShortKey(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	_, err := NewSessionStore(ctx, "short-key", false)
	if err == nil {
		t.Error("expected error for short encryption key")
	}
}

func TestSessionStore_CreateAndGet(t *testing.T) {
	ss := newTestSessionStore(t)

	data := &SessionData{
		AdminID:   42,
		AdminName: "Test Admin",
		Email:     "admin@test.com",
	}

	// Create session
	w := httptest.NewRecorder()
	if err := ss.Create(w, data); err != nil {
		t.Fatalf("Create failed: %v", err)
	}

	// Extract cookie from response
	resp := w.Result()
	cookies := resp.Cookies()
	if len(cookies) == 0 {
		t.Fatal("expected session cookie to be set")
	}

	var sessionCookie *http.Cookie
	for _, c := range cookies {
		if c.Name == "__session" {
			sessionCookie = c
			break
		}
	}
	if sessionCookie == nil {
		t.Fatal("expected __session cookie")
	}
	if sessionCookie.Value == "" {
		t.Fatal("expected non-empty session cookie value")
	}
	if !sessionCookie.HttpOnly {
		t.Error("expected session cookie to be HttpOnly")
	}

	// Get session using the cookie
	r := httptest.NewRequest("GET", "/", nil)
	r.AddCookie(sessionCookie)

	got, sessionID := ss.Get(r)
	if got == nil {
		t.Fatal("expected session data, got nil")
	}
	if sessionID == "" {
		t.Fatal("expected session ID, got empty string")
	}
	if got.AdminID != 42 {
		t.Errorf("AdminID = %d, want 42", got.AdminID)
	}
	if got.AdminName != "Test Admin" {
		t.Errorf("AdminName = %q, want %q", got.AdminName, "Test Admin")
	}
	if got.Email != "admin@test.com" {
		t.Errorf("Email = %q, want %q", got.Email, "admin@test.com")
	}
}

func TestSessionStore_GetWithNoCookie(t *testing.T) {
	ss := newTestSessionStore(t)
	r := httptest.NewRequest("GET", "/", nil)

	data, sessionID := ss.Get(r)
	if data != nil {
		t.Error("expected nil session data for request without cookie")
	}
	if sessionID != "" {
		t.Error("expected empty session ID for request without cookie")
	}
}

func TestSessionStore_GetWithInvalidCookie(t *testing.T) {
	ss := newTestSessionStore(t)
	r := httptest.NewRequest("GET", "/", nil)
	r.AddCookie(&http.Cookie{Name: "__session", Value: "totally-invalid-value"})

	data, sessionID := ss.Get(r)
	if data != nil {
		t.Error("expected nil session data for invalid cookie")
	}
	if sessionID != "" {
		t.Error("expected empty session ID for invalid cookie")
	}
}

func TestSessionStore_Destroy(t *testing.T) {
	ss := newTestSessionStore(t)

	// Create a session
	data := &SessionData{AdminID: 1, AdminName: "Admin", Email: "a@b.com"}
	w := httptest.NewRecorder()
	if err := ss.Create(w, data); err != nil {
		t.Fatalf("Create failed: %v", err)
	}

	resp := w.Result()
	var sessionCookie *http.Cookie
	for _, c := range resp.Cookies() {
		if c.Name == "__session" {
			sessionCookie = c
		}
	}

	// Verify session exists
	getReq := httptest.NewRequest("GET", "/", nil)
	getReq.AddCookie(sessionCookie)
	if got, _ := ss.Get(getReq); got == nil {
		t.Fatal("session should exist before destroy")
	}

	// Destroy
	destroyW := httptest.NewRecorder()
	destroyReq := httptest.NewRequest("GET", "/logout", nil)
	destroyReq.AddCookie(sessionCookie)
	ss.Destroy(destroyW, destroyReq)

	// Verify destroyed
	getReq2 := httptest.NewRequest("GET", "/", nil)
	getReq2.AddCookie(sessionCookie)
	if got, _ := ss.Get(getReq2); got != nil {
		t.Error("session should be nil after destroy")
	}

	// Verify cookie is cleared in response
	destroyResp := destroyW.Result()
	for _, c := range destroyResp.Cookies() {
		if c.Name == "__session" && c.MaxAge != -1 {
			t.Errorf("expected MaxAge=-1 for destroyed session, got %d", c.MaxAge)
		}
	}
}

func TestSessionStore_TTLExpiry(t *testing.T) {
	ss := newTestSessionStore(t)

	data := &SessionData{AdminID: 1, AdminName: "Admin", Email: "a@b.com"}
	w := httptest.NewRecorder()
	if err := ss.Create(w, data); err != nil {
		t.Fatalf("Create failed: %v", err)
	}

	resp := w.Result()
	var sessionCookie *http.Cookie
	for _, c := range resp.Cookies() {
		if c.Name == "__session" {
			sessionCookie = c
		}
	}

	// Manually expire the session by setting CreatedAt to the past
	ss.mu.Lock()
	for _, sd := range ss.sessions {
		sd.CreatedAt = time.Now().Add(-3 * time.Hour).Unix()
	}
	ss.mu.Unlock()

	// Try to get — should be expired
	r := httptest.NewRequest("GET", "/", nil)
	r.AddCookie(sessionCookie)
	got, _ := ss.Get(r)
	if got != nil {
		t.Error("expected nil session data after TTL expiry")
	}
}

func TestSessionStore_ReplacesExistingSessionForSameAdmin(t *testing.T) {
	ss := newTestSessionStore(t)

	data := &SessionData{AdminID: 42, AdminName: "Admin", Email: "a@b.com"}

	// Create first session
	w1 := httptest.NewRecorder()
	if err := ss.Create(w1, data); err != nil {
		t.Fatalf("Create 1 failed: %v", err)
	}
	var cookie1 *http.Cookie
	for _, c := range w1.Result().Cookies() {
		if c.Name == "__session" {
			cookie1 = c
		}
	}

	// Create second session for same admin
	data2 := &SessionData{AdminID: 42, AdminName: "Admin Updated", Email: "a@b.com"}
	w2 := httptest.NewRecorder()
	if err := ss.Create(w2, data2); err != nil {
		t.Fatalf("Create 2 failed: %v", err)
	}

	// First session should be invalidated
	r1 := httptest.NewRequest("GET", "/", nil)
	r1.AddCookie(cookie1)
	if got, _ := ss.Get(r1); got != nil {
		t.Error("expected first session to be invalidated after new session created for same admin")
	}
}

func TestSessionStore_EncryptDecryptRoundTrip(t *testing.T) {
	ss := newTestSessionStore(t)

	plaintext := "test-session-id-12345"
	encrypted, err := ss.encrypt(plaintext)
	if err != nil {
		t.Fatalf("encrypt failed: %v", err)
	}

	if encrypted == plaintext {
		t.Error("encrypted should differ from plaintext")
	}

	decrypted, err := ss.decrypt(encrypted)
	if err != nil {
		t.Fatalf("decrypt failed: %v", err)
	}

	if decrypted != plaintext {
		t.Errorf("decrypt = %q, want %q", decrypted, plaintext)
	}
}
