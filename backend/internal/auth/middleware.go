package auth

import (
	"context"
	"net/http"
)

type contextKey string

const (
	adminKey     contextKey = "admin"
	sessionIDKey contextKey = "sessionID"
)

func ContextWithSession(ctx context.Context, data *SessionData, sessionID string) context.Context {
	ctx = context.WithValue(ctx, adminKey, data)
	ctx = context.WithValue(ctx, sessionIDKey, sessionID)
	return ctx
}

func RequireAdmin(sessions *SessionStore, next http.HandlerFunc) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		data, sessionID := sessions.Get(r)
		if data == nil {
			http.Redirect(w, r, "/login", http.StatusFound)
			return
		}
		// Force password change if required (allow the change-password route itself)
		if data.MustChangePassword && r.URL.Path != "/change-password" {
			http.Redirect(w, r, "/change-password", http.StatusFound)
			return
		}
		ctx := ContextWithSession(r.Context(), data, sessionID)
		next(w, r.WithContext(ctx))
	})
}

func OptionalAdmin(sessions *SessionStore, next http.HandlerFunc) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		data, sessionID := sessions.Get(r)
		if data != nil {
			ctx := ContextWithSession(r.Context(), data, sessionID)
			next(w, r.WithContext(ctx))
			return
		}
		next(w, r)
	})
}

func AdminFromContext(ctx context.Context) *SessionData {
	data, _ := ctx.Value(adminKey).(*SessionData)
	return data
}

func SessionIDFromContext(ctx context.Context) string {
	s, _ := ctx.Value(sessionIDKey).(string)
	return s
}
