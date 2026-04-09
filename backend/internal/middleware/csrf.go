package middleware

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"net/http"
	"strings"
)

type csrfContextKey struct{}

const csrfCookieName = "__xsrf-token"

func CSRF(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Skip CSRF for static assets, health check, and public API endpoints
		if strings.HasPrefix(r.URL.Path, "/assets/") || r.URL.Path == "/health" || strings.HasPrefix(r.URL.Path, "/api/v1/") {
			next.ServeHTTP(w, r)
			return
		}

		cookie, err := r.Cookie(csrfCookieName)
		if err != nil || cookie.Value == "" {
			token := generateCSRFToken()
			http.SetCookie(w, &http.Cookie{
				Name:     csrfCookieName,
				Value:    token,
				Path:     "/",
				HttpOnly: false,
				SameSite: http.SameSiteLaxMode,
			})
			cookie = &http.Cookie{Value: token}
		}

		if r.Method == "POST" {
			headerToken := r.Header.Get("X-CSRF-TOKEN")
			formToken := r.FormValue("_csrf")
			token := headerToken
			if token == "" {
				token = formToken
			}
			if token != cookie.Value {
				http.Error(w, "Forbidden - CSRF token mismatch", http.StatusForbidden)
				return
			}
		}

		ctx := context.WithValue(r.Context(), csrfContextKey{}, cookie.Value)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func CSRFTokenFromRequest(r *http.Request) string {
	if token, ok := r.Context().Value(csrfContextKey{}).(string); ok && token != "" {
		return token
	}
	if c, err := r.Cookie(csrfCookieName); err == nil {
		return c.Value
	}
	return ""
}

func generateCSRFToken() string {
	b := make([]byte, 32)
	_, _ = rand.Read(b)
	return hex.EncodeToString(b)
}
