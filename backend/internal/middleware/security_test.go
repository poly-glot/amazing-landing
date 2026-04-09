package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestSecurityHeaders(t *testing.T) {
	handler := SecurityHeaders(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))

	r := httptest.NewRequest("GET", "/", nil)
	w := httptest.NewRecorder()
	handler.ServeHTTP(w, r)

	expected := map[string]string{
		"X-Content-Type-Options":    "nosniff",
		"X-Frame-Options":          "DENY",
		"Strict-Transport-Security": "max-age=63072000; includeSubDomains",
		"Referrer-Policy":           "strict-origin-when-cross-origin",
		"Permissions-Policy":        "camera=(), microphone=(), geolocation=()",
	}

	for header, want := range expected {
		got := w.Header().Get(header)
		if got != want {
			t.Errorf("%s = %q, want %q", header, got, want)
		}
	}
}

func TestCSP_SetsContentSecurityPolicy(t *testing.T) {
	handler := CSP("")(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		nonce := NonceFromContext(r.Context())
		if nonce == "" {
			t.Error("expected non-empty nonce in context")
		}
		w.WriteHeader(http.StatusOK)
	}))

	r := httptest.NewRequest("GET", "/admin", nil)
	w := httptest.NewRecorder()
	handler.ServeHTTP(w, r)

	csp := w.Header().Get("Content-Security-Policy")
	if csp == "" {
		t.Fatal("expected Content-Security-Policy header")
	}

	// Verify key directives
	for _, directive := range []string{"default-src 'self'", "script-src", "style-src", "form-action 'self'"} {
		if !containsSubstring(csp, directive) {
			t.Errorf("CSP missing directive %q", directive)
		}
	}
}

func TestCSP_IncludesViteDevURL(t *testing.T) {
	handler := CSP("http://localhost:5173")(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))

	r := httptest.NewRequest("GET", "/admin", nil)
	w := httptest.NewRecorder()
	handler.ServeHTTP(w, r)

	csp := w.Header().Get("Content-Security-Policy")
	if !containsSubstring(csp, "http://localhost:5173") {
		t.Error("CSP should include Vite dev URL")
	}
	if !containsSubstring(csp, "ws://localhost:5173") {
		t.Error("CSP should include Vite WebSocket URL")
	}
}

func TestLogging_SetsStatusCode(t *testing.T) {
	handler := Logging(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusCreated)
	}))

	r := httptest.NewRequest("GET", "/test", nil)
	w := httptest.NewRecorder()
	handler.ServeHTTP(w, r)

	if w.Code != http.StatusCreated {
		t.Errorf("status = %d, want %d", w.Code, http.StatusCreated)
	}
}

func containsSubstring(s, substr string) bool {
	return len(s) >= len(substr) && (s == substr || len(s) > 0 && containsHelper(s, substr))
}

func containsHelper(s, substr string) bool {
	for i := 0; i <= len(s)-len(substr); i++ {
		if s[i:i+len(substr)] == substr {
			return true
		}
	}
	return false
}
