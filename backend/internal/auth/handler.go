package auth

import (
	"context"
	"log/slog"
	"net/http"

	"golang.org/x/crypto/bcrypt"
)

type authenticator interface {
	Authenticate(ctx context.Context, email, password string) (*SessionData, bool, error)
}

type RenderFunc func(w http.ResponseWriter, r *http.Request, name string, data map[string]any)

type Handler struct {
	provider  authenticator
	sessions  *SessionStore
	flashes   *FlashStore
	repo      adminFinder
	render    RenderFunc
	demoMode  bool
}

func NewHandler(provider authenticator, sessions *SessionStore, flashes *FlashStore, repo adminFinder, render RenderFunc, demoMode bool) *Handler {
	return &Handler{
		provider: provider,
		sessions: sessions,
		flashes:  flashes,
		repo:     repo,
		render:   render,
		demoMode: demoMode,
	}
}

func (h *Handler) LoginPage(w http.ResponseWriter, r *http.Request) {
	h.render(w, r, "login.html", nil)
}

func (h *Handler) Login(w http.ResponseWriter, r *http.Request) {
	if err := r.ParseForm(); err != nil {
		h.render(w, r, "login.html", map[string]any{"Error": "Invalid request"})
		return
	}

	email := r.FormValue("email")
	password := r.FormValue("password")

	sessionData, mustChange, err := h.provider.Authenticate(r.Context(), email, password)
	if err != nil {
		slog.Warn("login failed", "email", email, "error", err)
		h.render(w, r, "login.html", map[string]any{"Error": "Invalid email or password"})
		return
	}

	if err := h.sessions.Create(w, sessionData); err != nil {
		slog.Error("session creation failed", "error", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	if mustChange && !(h.demoMode && email == "admin@azadi.com") {
		http.Redirect(w, r, "/change-password", http.StatusFound)
		return
	}

	http.Redirect(w, r, "/admin", http.StatusFound)
}

func (h *Handler) Logout(w http.ResponseWriter, r *http.Request) {
	h.sessions.Destroy(w, r)
	http.Redirect(w, r, "/login", http.StatusFound)
}

func (h *Handler) ChangePasswordPage(w http.ResponseWriter, r *http.Request) {
	admin := AdminFromContext(r.Context())
	data := map[string]any{}
	if admin != nil && admin.MustChangePassword {
		data["ForcedChange"] = true
	}
	h.render(w, r, "change-password.html", data)
}

func (h *Handler) ChangePassword(w http.ResponseWriter, r *http.Request) {
	if err := r.ParseForm(); err != nil {
		h.render(w, r, "change-password.html", map[string]any{"Error": "Invalid request"})
		return
	}

	admin := AdminFromContext(r.Context())
	if admin == nil {
		http.Redirect(w, r, "/login", http.StatusFound)
		return
	}

	currentPassword := r.FormValue("current_password")
	newPassword := r.FormValue("new_password")
	confirmPassword := r.FormValue("confirm_password")

	user, err := h.repo.FindByEmail(r.Context(), admin.Email)
	if err != nil || user == nil {
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	// Verify current password (skip for forced change on first login)
	if !admin.MustChangePassword {
		if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(currentPassword)); err != nil {
			h.render(w, r, "change-password.html", map[string]any{"Error": "Current password is incorrect"})
			return
		}
	}

	if len(newPassword) < 8 {
		h.render(w, r, "change-password.html", map[string]any{"Error": "Password must be at least 8 characters"})
		return
	}
	if len(newPassword) > 128 {
		h.render(w, r, "change-password.html", map[string]any{"Error": "Password must be at most 128 characters"})
		return
	}
	if newPassword != confirmPassword {
		h.render(w, r, "change-password.html", map[string]any{"Error": "Passwords do not match"})
		return
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	user.PasswordHash = string(hash)
	user.MustChangePassword = false
	if _, err := h.repo.Save(r.Context(), user); err != nil {
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	// Recreate session to clear MustChangePassword flag
	newSession := &SessionData{
		AdminID:            admin.AdminID,
		AdminName:          admin.AdminName,
		Email:              admin.Email,
		MustChangePassword: false,
	}
	if err := h.sessions.Create(w, newSession); err != nil {
		slog.Error("session recreation failed", "error", err)
	}

	sessionID := SessionIDFromContext(r.Context())
	h.flashes.Set(sessionID, "success", "Password changed successfully")
	http.Redirect(w, r, "/admin", http.StatusFound)
}
