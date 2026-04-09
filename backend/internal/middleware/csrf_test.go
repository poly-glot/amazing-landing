package middleware

import (
	"net/http"
	"net/http/httptest"
	"net/url"
	"strings"
	"testing"
)

func TestCSRF_SetsTokenCookieOnFirstVisit(t *testing.T) {
	handler := CSRF(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))

	r := httptest.NewRequest("GET", "/admin", nil)
	w := httptest.NewRecorder()
	handler.ServeHTTP(w, r)

	resp := w.Result()
	var found bool
	for _, c := range resp.Cookies() {
		if c.Name == csrfCookieName {
			found = true
			if c.Value == "" {
				t.Error("expected non-empty CSRF token")
			}
			if c.HttpOnly {
				t.Error("CSRF cookie should not be HttpOnly (JS needs to read it)")
			}
		}
	}
	if !found {
		t.Error("expected CSRF cookie to be set")
	}
}

func TestCSRF_BlocksPOSTWithoutToken(t *testing.T) {
	handler := CSRF(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		t.Error("handler should not be called without CSRF token")
	}))

	r := httptest.NewRequest("POST", "/login", nil)
	r.AddCookie(&http.Cookie{Name: csrfCookieName, Value: "valid-token"})
	w := httptest.NewRecorder()
	handler.ServeHTTP(w, r)

	if w.Code != http.StatusForbidden {
		t.Errorf("status = %d, want %d", w.Code, http.StatusForbidden)
	}
}

func TestCSRF_AllowsPOSTWithMatchingFormToken(t *testing.T) {
	var handlerCalled bool
	handler := CSRF(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		handlerCalled = true
		w.WriteHeader(http.StatusOK)
	}))

	form := url.Values{"_csrf": {"valid-token"}}
	r := httptest.NewRequest("POST", "/login", strings.NewReader(form.Encode()))
	r.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	r.AddCookie(&http.Cookie{Name: csrfCookieName, Value: "valid-token"})
	w := httptest.NewRecorder()
	handler.ServeHTTP(w, r)

	if !handlerCalled {
		t.Error("expected handler to be called with valid CSRF token")
	}
}

func TestCSRF_AllowsPOSTWithMatchingHeaderToken(t *testing.T) {
	var handlerCalled bool
	handler := CSRF(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		handlerCalled = true
	}))

	r := httptest.NewRequest("POST", "/admin/stores", nil)
	r.Header.Set("X-CSRF-TOKEN", "valid-token")
	r.AddCookie(&http.Cookie{Name: csrfCookieName, Value: "valid-token"})
	w := httptest.NewRecorder()
	handler.ServeHTTP(w, r)

	if !handlerCalled {
		t.Error("expected handler to be called with valid header CSRF token")
	}
}

func TestCSRF_RejectsMismatchedToken(t *testing.T) {
	handler := CSRF(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		t.Error("handler should not be called with mismatched CSRF token")
	}))

	form := url.Values{"_csrf": {"wrong-token"}}
	r := httptest.NewRequest("POST", "/login", strings.NewReader(form.Encode()))
	r.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	r.AddCookie(&http.Cookie{Name: csrfCookieName, Value: "actual-token"})
	w := httptest.NewRecorder()
	handler.ServeHTTP(w, r)

	if w.Code != http.StatusForbidden {
		t.Errorf("status = %d, want %d", w.Code, http.StatusForbidden)
	}
}

func TestCSRF_SkipsStaticAssets(t *testing.T) {
	var handlerCalled bool
	handler := CSRF(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		handlerCalled = true
	}))

	r := httptest.NewRequest("GET", "/assets/main.css", nil)
	w := httptest.NewRecorder()
	handler.ServeHTTP(w, r)

	if !handlerCalled {
		t.Error("expected handler to be called for static assets")
	}
	// Should not set a CSRF cookie on static assets
	for _, c := range w.Result().Cookies() {
		if c.Name == csrfCookieName {
			t.Error("should not set CSRF cookie on static asset requests")
		}
	}
}

func TestCSRF_SkipsHealthEndpoint(t *testing.T) {
	var handlerCalled bool
	handler := CSRF(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		handlerCalled = true
	}))

	r := httptest.NewRequest("GET", "/health", nil)
	w := httptest.NewRecorder()
	handler.ServeHTTP(w, r)

	if !handlerCalled {
		t.Error("expected handler to be called for /health")
	}
}

func TestCSRFTokenFromRequest_FromContext(t *testing.T) {
	handler := CSRF(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		token := CSRFTokenFromRequest(r)
		if token == "" {
			t.Error("expected non-empty CSRF token from context")
		}
	}))

	r := httptest.NewRequest("GET", "/admin", nil)
	w := httptest.NewRecorder()
	handler.ServeHTTP(w, r)
}
